/-
  Lean 4 model of Audapter's online status tracking (OST), blab audapter_mex @169cadf:
    TransShiftMex/ost.cpp  OST_TAB::osTrack   (lines 327-738)
    TransShiftMex/ost.cpp  OST_TAB::reset     (lines 97-101)
    TransShiftMex/Audapter.cpp  reset(): stat = 0 (line 651);  handleBuffer: stat = ostTab.osTrack(...) (1797)

  Faithfulness notes (see README.md#ost for the full list):
  * `statOnsetIndices` is modelled as a total function Int → Int (the C array has 4n entries;
    out-of-range state numbers are a separate, already-reported bug, OST-F7).
  * rms values are an abstract type `α` with the C comparison operators (`Num`); nothing about
    them is assumed, so NaN behaviour of `double` is covered.
  * Quantities that the C code derives from the constant frameDur (minDurN per rule, the
    ELAPSED_TIME / maxIOI "frames * frameDur > seconds" tests, nLBDelay) are taken as table
    parameters: arbitrary values/predicates, exactly one per rule, fixed for the session.
  * Each rule branch that does `stat_out = stat + 1; statOnsetIndices[stat_out] = frame_counter;`
    is modelled as returning `out = stat + 1, wrote = true`; the write is then applied.
-/
namespace Ost

/-- The C comparison/arithmetic operations on `double` that osTrack uses. -/
class Num (α : Type) where
  lt : α → α → Bool      -- a < b
  le : α → α → Bool      -- a <= b
  add : α → α → α
  ofInt : Int → α

inductive Mode where
  | END | ELAPSED_TIME | RISE_HOLD | RISE_HOLD_POS_SLOPE | POS_SLOPE_STRETCH
  | NEG_SLOPE_STRETCH_SPAN | SLOPE_BELOW | SLOPE_ABOVE | FALL | BELOW_NEG_SLOPE
  | RATIO_RISE | RATIO_FALL_HOLD | RATIO_ABOVE_FLOOR | AND_RATIO_ABOVE | AND_RATIO_BELOW
  | OTHER   -- numeric mode codes with no branch (e.g. "2"): osTrack does nothing
  deriving DecidableEq, Repr

/-- Per-call inputs of osTrack (ost.cpp:327-329). -/
structure Obs (α : Type) where
  dc   : Int        -- data_counter
  fc   : Int        -- frame_counter
  rms  : α          -- rms_s
  slp  : α          -- rms_o_slp
  inv  : α          -- 1. / rms_ratio  (computed identically at each use)
  hist : Int → α    -- rms_rec (= a_rms_o, written in the current trial)

/-- One maxIOI line: stat0, maxInterval (as a predicate on elapsed frames), stat1. -/
structure IOI where
  s0 : Int
  exceeds : Int → Bool
  s1 : Int

structure Tab (α : Type) where
  n      : Nat
  stat0  : Nat → Int          -- stat0[i]; stat0 n is whatever lies past the array (OST-F3)
  mode   : Nat → Mode
  p1     : Nat → α
  p2     : Nat → α
  p3     : Nat → α
  minDur : Nat → Int          -- minDurN as the code computes it for rule k
  elapsedGT : Nat → Int → Bool -- ELAPSED_TIME: (frames) * frameDur > prm1[k]
  nLB    : Nat                -- nLBDelay (ost.cpp:344)
  floor0 : α                  -- 0.0003 (mode 32)
  ioi    : List IOI           -- maxIOICfg

structure St (α : Type) where
  stat  : Int
  sc    : Int                 -- stretchCnt
  lse   : Int                 -- lastStatEnd
  span  : α                   -- stretchSpanAccum
  onset : Int → Int           -- statOnsetIndices

structure RuleOut (α : Type) where
  out   : Int
  sc    : Int
  lse   : Int
  span  : α
  wrote : Bool                -- statOnsetIndices[stat + 1] = frame_counter was executed

variable {α : Type} [Num α]
open Num

/-- Segment lookup, ost.cpp:350-356: first i < n with stat0[i] <= stat < stat0[i+1]. -/
def findSeg (T : Tab α) (stat : Int) : Option Nat :=
  (List.range T.n).find? (fun i => decide (T.stat0 i ≤ stat ∧ stat < T.stat0 (i + 1)))

/-- The common "+2" shape: modes 5, 6, 10, 12, 13, 21, 40, 45 (ost.cpp:367-527, 553-576, 646-693). -/
def hold2 (stat t0 sc lse : Int) (span : α) (cond : Bool) (passes : Int → Bool) (dc : Int) : RuleOut α :=
  if stat = t0 then
    (if cond then ⟨stat + 1, 1, lse, span, true⟩ else ⟨stat, sc, lse, span, false⟩)
  else if cond then
    (if passes (sc + 1) then ⟨stat + 1, sc + 1, dc, span, true⟩ else ⟨stat, sc + 1, lse, span, false⟩)
  else ⟨stat - 1, sc, lse, span, false⟩

/-- Ratio modes 30, 31, 32 (ost.cpp:578-644). `third` = the `else` branch (absent in 32). -/
def ratio3 (stat t0 sc lse : Int) (span : α) (c : Bool) (minD : Int) (third : Option Bool) (dc : Int) : RuleOut α :=
  if stat = t0 then
    (if c then ⟨stat + 1, 0, lse, span, true⟩ else ⟨stat, sc, lse, span, false⟩)
  else if stat - t0 = 1 then
    (if c then (if sc + 1 > minD then ⟨stat + 1, sc + 1, lse, span, true⟩ else ⟨stat, sc + 1, lse, span, false⟩)
     else ⟨stat - 1, sc, lse, span, false⟩)
  else match third with
    | some true => ⟨stat + 1, sc, dc, span, true⟩
    | _ => ⟨stat, sc, lse, span, false⟩

/-- The rule part of osTrack for segment k (ost.cpp:358-697). Reads the onset array only at
    `stat` (ELAPSED_TIME), passed in as `onStat`. -/
def ruleStep (T : Tab α) (k : Nat) (stat sc lse : Int) (span : α) (onStat : Int) (o : Obs α) : RuleOut α :=
  let t0 := T.stat0 k
  let same : RuleOut α := ⟨stat, sc, lse, span, false⟩
  let md := T.minDur k
  let z : α := ofInt 0
  match T.mode k with
  | .ELAPSED_TIME => if T.elapsedGT k (o.dc - onStat) then ⟨stat + 1, sc, lse, span, true⟩ else same
  | .RISE_HOLD => hold2 stat t0 sc lse span (lt (T.p1 k) o.rms) (fun s => decide (s > md)) o.dc
  | .RISE_HOLD_POS_SLOPE =>
      hold2 stat t0 sc lse span (lt (T.p1 k) o.rms && lt z o.slp) (fun s => decide (s > md)) o.dc
  | .POS_SLOPE_STRETCH => hold2 stat t0 sc lse span (lt z o.slp) (fun s => lt (T.p1 k) (ofInt s)) o.dc
  | .NEG_SLOPE_STRETCH_SPAN =>
      if stat = t0 then
        (if lt o.slp z then ⟨stat + 1, 1, lse, o.slp, true⟩ else same)
      else if lt o.slp z then
        (let sp := add span o.slp
         if lt (T.p1 k) (ofInt (sc + 1)) && lt sp (T.p2 k) then ⟨stat + 1, sc + 1, o.dc, sp, true⟩
         else ⟨stat, sc + 1, lse, sp, false⟩)
      else ⟨stat - 1, sc, lse, span, false⟩
  | .SLOPE_BELOW => hold2 stat t0 sc lse span (lt o.slp (T.p1 k)) (fun s => decide (s > md)) o.dc
  | .SLOPE_ABOVE => hold2 stat t0 sc lse span (lt (T.p1 k) o.slp) (fun s => decide (s > md)) o.dc
  | .FALL =>
      let goet := (List.range T.nLB).any (fun j => decide (o.dc - j < 0) || le (T.p1 k) (o.hist (o.dc - j)))
      if !goet && decide (o.dc - lse > md) then ⟨stat + 1, sc, o.dc, span, true⟩ else same
  | .BELOW_NEG_SLOPE =>
      hold2 stat t0 sc lse span (lt o.rms (T.p1 k) && lt o.slp z) (fun s => decide (s > md)) o.dc
  | .RATIO_RISE => ratio3 stat t0 sc lse span (lt (T.p1 k) o.inv) md (some (lt o.inv (T.p1 k))) o.dc
  | .RATIO_FALL_HOLD => ratio3 stat t0 sc lse span (lt o.inv (T.p1 k)) md (some (lt o.inv (T.p1 k))) o.dc
  | .RATIO_ABOVE_FLOOR =>
      ratio3 stat t0 sc lse span (lt (T.p1 k) o.inv && le T.floor0 o.rms) md none o.dc
  | .AND_RATIO_ABOVE =>
      hold2 stat t0 sc lse span (lt (T.p1 k) o.rms && lt (T.p2 k) o.inv) (fun s => decide (s > md)) o.dc
  | .AND_RATIO_BELOW =>
      hold2 stat t0 sc lse span (lt o.rms (T.p1 k) && lt o.inv (T.p2 k)) (fun s => decide (s > md)) o.dc
  | .END => same
  | .OTHER => same

/-- One maxIOI line, ost.cpp:722-734.  `fixed = false` is the shipped code, which writes
    `statOnsetIndices[stat]` (s1 - stat times); `fixed = true` writes `[j]` for j in (stat, s1]. -/
def ioiStep (fixed : Bool) (stat fc : Int) (acc : Int × (Int → Int)) (e : IOI) : Int × (Int → Int) :=
  if e.s0 ≤ stat ∧ stat < e.s1 ∧ e.exceeds (fc - acc.2 e.s0) = true then
    (e.s1, if fixed then (fun s => if stat < s ∧ s ≤ e.s1 then fc else acc.2 s)
                    else (fun s => if s = stat then fc else acc.2 s))
  else acc

def upd (f : Int → Int) (i v : Int) : Int → Int := fun s => if s = i then v else f s

/-- osTrack, and the assignment `stat = ostTab.osTrack(stat, ...)` (Audapter.cpp:1797). -/
def step (fixed : Bool) (T : Tab α) (σ : St α) (o : Obs α) : St α :=
  if T.n = 0 then { σ with stat := 0 } else
  let r : RuleOut α := match findSeg T σ.stat with
    | none => ⟨σ.stat, σ.sc, σ.lse, σ.span, false⟩
    | some k => ruleStep T k σ.stat σ.sc σ.lse σ.span (σ.onset σ.stat) o
  let on1 := if r.wrote then upd σ.onset (σ.stat + 1) o.fc else σ.onset
  let res := T.ioi.foldl (ioiStep fixed σ.stat o.fc) (r.out, on1)
  { stat := res.1, sc := r.sc, lse := r.lse, span := r.span, onset := res.2 }

/-- Trial start. `withOstReset = false` is the shipped code (only Audapter::reset's `stat = 0`);
    `true` adds the proposed `ostTab.reset()` call (ost.cpp:97-101). Onsets are never cleared. -/
def trialReset (withOstReset : Bool) (σ : St α) : St α :=
  if withOstReset then { σ with stat := 0, sc := 0, lse := 0, span := ofInt 0 } else { σ with stat := 0 }

/-- State right after readFromFile: calloc'ed onsets, constructor counters. -/
def load : St α := { stat := 0, sc := 0, lse := 0, span := ofInt 0, onset := fun _ => 0 }

/-- The sequence of `stat` values produced frame by frame. -/
def run (fixed : Bool) (T : Tab α) : St α → List (Obs α) → List Int
  | _, [] => []
  | σ, o :: os => let σ' := step fixed T σ o; σ'.stat :: run fixed T σ' os

def runState (fixed : Bool) (T : Tab α) : St α → List (Obs α) → St α
  | σ, [] => σ
  | σ, o :: os => runState fixed T (step fixed T σ o) os

/-- A session: a list of trials, each started with trialReset. -/
def session (fixed rst : Bool) (T : Tab α) (σ : St α) : List (List (Obs α)) → St α
  | [] => σ
  | tr :: trs => session fixed rst T (runState fixed T (trialReset rst σ) tr) trs

/-! ## Well-formed tables (what a load-time validator should enforce; notes/ost-pcf.md rec. 1) -/
def WF (T : Tab α) : Prop := (∀ i, i < T.n → 0 ≤ T.stat0 i) ∧ (∀ e ∈ T.ioi, 0 ≤ e.s0)

/-! ## Lemmas -/

theorem findSeg_spec {T : Tab α} {stat : Int} {k : Nat} (h : findSeg T stat = some k) :
    k < T.n ∧ T.stat0 k ≤ stat := by
  unfold findSeg at h
  have hm := List.mem_of_find?_eq_some h
  have hp := List.find?_some h
  simp at hm hp
  exact ⟨hm, hp.1⟩

/-- Shape of every rule outcome: stay, +1 with the onset write, or -1 (only above the segment start). -/
theorem ruleStep_shape (T : Tab α) (k : Nat) (stat sc lse : Int) (span : α) (onStat : Int) (o : Obs α)
    (h : T.stat0 k ≤ stat) :
    let r := ruleStep T k stat sc lse span onStat o
    (r.out = stat ∧ r.wrote = false) ∨ (r.out = stat + 1 ∧ r.wrote = true) ∨
    (r.out = stat - 1 ∧ T.stat0 k < stat ∧ r.wrote = false) := by
  intro r
  simp only [r, ruleStep]
  split <;> (try simp only [hold2, ratio3]) <;> (repeat' split) <;> simp_all <;> omega

/-- Agreement of two states on everything osTrack can read: scalars and onsets of states 0..stat. -/
def Agree (σ₁ σ₂ : St α) : Prop :=
  σ₁.stat = σ₂.stat ∧ σ₁.sc = σ₂.sc ∧ σ₁.lse = σ₂.lse ∧ σ₁.span = σ₂.span ∧
  ∀ s, 0 ≤ s → s ≤ σ₁.stat → σ₁.onset s = σ₂.onset s

/-- The (fixed) maxIOI fold preserves agreement: if the onset arrays agree on
    [0, max stat out], the fold gives the same output and arrays that agree on
    [0, max stat out'].  (False for the shipped code: skipped states are not written.) -/
theorem ioi_congr (L : List IOI) (stat fc out : Int) (f g : Int → Int)
    (hL : ∀ e ∈ L, 0 ≤ e.s0)
    (hagree : ∀ s, 0 ≤ s → s ≤ max stat out → f s = g s) :
    (L.foldl (ioiStep true stat fc) (out, f)).1 = (L.foldl (ioiStep true stat fc) (out, g)).1 ∧
    ∀ s, 0 ≤ s → s ≤ max stat (L.foldl (ioiStep true stat fc) (out, f)).1 →
      (L.foldl (ioiStep true stat fc) (out, f)).2 s = (L.foldl (ioiStep true stat fc) (out, g)).2 s := by
  induction L generalizing out f g with
  | nil => exact ⟨rfl, hagree⟩
  | cons e L ih =>
    have he : 0 ≤ e.s0 := hL e (by simp)
    have hL' : ∀ e ∈ L, 0 ≤ e.s0 := fun e' h' => hL e' (by simp [h'])
    simp only [List.foldl]
    by_cases hg : e.s0 ≤ stat ∧ stat < e.s1 ∧ e.exceeds (fc - f e.s0) = true
    · have hfg : f e.s0 = g e.s0 := hagree _ he (by omega)
      have hg' : e.s0 ≤ stat ∧ stat < e.s1 ∧ e.exceeds (fc - g e.s0) = true := by rw [← hfg]; exact hg
      simp only [ioiStep, hg, hg', if_true, and_self]
      apply ih _ _ _ hL'
      intro s hs1 hs2
      by_cases hw : stat < s ∧ s ≤ e.s1
      · simp [hw]
      · simp only [hw, if_false]; exact hagree s hs1 (by omega)
    · have hg' : ¬ (e.s0 ≤ stat ∧ stat < e.s1 ∧ e.exceeds (fc - g e.s0) = true) := by
        intro h; apply hg
        have hfg : f e.s0 = g e.s0 := hagree _ he (by omega)
        rw [hfg]; exact h
      simp only [ioiStep, hg, hg', if_false]
      exact ih _ _ _ hL' hagree

theorem ioi_nonneg (fixed : Bool) (L : List IOI) (stat fc out : Int) (f : Int → Int)
    (hs : 0 ≤ stat) (ho : 0 ≤ out) : 0 ≤ (L.foldl (ioiStep fixed stat fc) (out, f)).1 := by
  induction L generalizing out f with
  | nil => simpa using ho
  | cons e L ih =>
    simp only [List.foldl]
    by_cases hg : e.s0 ≤ stat ∧ stat < e.s1 ∧ e.exceeds (fc - f e.s0) = true
    · have : ioiStep fixed stat fc (out, f) e = (e.s1, (ioiStep fixed stat fc (out, f) e).2) := by
        simp only [ioiStep]; rw [if_pos hg]
      rw [this]; exact ih _ _ (by omega)
    · have : ioiStep fixed stat fc (out, f) e = (out, f) := by
        simp only [ioiStep]; rw [if_neg hg]
      rw [this]; exact ih _ _ ho

/-- The fixed fold never writes an onset at or below `stat`. -/
theorem ioi_keeps_low (L : List IOI) (stat fc out : Int) (f : Int → Int) (s : Int) (hs : s ≤ stat) :
    (L.foldl (ioiStep true stat fc) (out, f)).2 s = f s := by
  induction L generalizing out f with
  | nil => rfl
  | cons e L ih =>
    simp only [List.foldl]
    by_cases hg : e.s0 ≤ stat ∧ stat < e.s1 ∧ e.exceeds (fc - f e.s0) = true
    · have : ioiStep true stat fc (out, f) e =
          (e.s1, fun s => if stat < s ∧ s ≤ e.s1 then fc else f s) := by
        simp only [ioiStep]; rw [if_pos hg]; rfl
      rw [this, ih]; show (if stat < s ∧ s ≤ e.s1 then fc else f s) = f s; rw [if_neg (by omega)]
    · have : ioiStep true stat fc (out, f) e = (out, f) := by
        simp only [ioiStep]; rw [if_neg hg]
      rw [this]; exact ih _ _

theorem step_congr (T : Tab α) (hwf : WF T) (σ₁ σ₂ : St α) (o : Obs α)
    (h : Agree σ₁ σ₂) (hs : 0 ≤ σ₁.stat) :
    Agree (step true T σ₁ o) (step true T σ₂ o) ∧ 0 ≤ (step true T σ₁ o).stat := by
  obtain ⟨hst, hsc, hlse, hspan, hon⟩ := h
  by_cases hn : T.n = 0
  · simp only [step, hn, if_true]
    refine ⟨⟨rfl, hsc, hlse, hspan, ?_⟩, by simp⟩
    intro s h1 h2; exact hon s h1 (by simp at h2; omega)
  · simp only [step, hn, if_false]
    rw [← hst, ← hsc, ← hlse, ← hspan]
    have honStat : σ₁.onset σ₁.stat = σ₂.onset σ₁.stat := hon _ hs (Int.le_refl _)
    rw [← honStat]
    -- the rule outcome is identical in both runs
    generalize hr : (match findSeg T σ₁.stat with
      | none => (⟨σ₁.stat, σ₁.sc, σ₁.lse, σ₁.span, false⟩ : RuleOut α)
      | some k => ruleStep T k σ₁.stat σ₁.sc σ₁.lse σ₁.span (σ₁.onset σ₁.stat) o) = r
    have hshape : (r.out = σ₁.stat ∧ r.wrote = false) ∨ (r.out = σ₁.stat + 1 ∧ r.wrote = true) ∨
        (r.out = σ₁.stat - 1 ∧ 0 ≤ r.out ∧ r.wrote = false) := by
      cases hk : findSeg T σ₁.stat with
      | none => rw [hk] at hr; subst hr; simp
      | some k =>
        rw [hk] at hr; subst hr
        dsimp only
        have ⟨hkn, hk0⟩ := findSeg_spec hk
        have h0 := hwf.1 k hkn
        rcases ruleStep_shape T k σ₁.stat σ₁.sc σ₁.lse σ₁.span (σ₁.onset σ₁.stat) o hk0 with h | h | h
        · exact Or.inl h
        · exact Or.inr (Or.inl h)
        · exact Or.inr (Or.inr ⟨h.1, by omega, h.2.2⟩)
    have hon1 : ∀ s, 0 ≤ s → s ≤ max σ₁.stat r.out →
        (if r.wrote then upd σ₁.onset (σ₁.stat + 1) o.fc else σ₁.onset) s =
        (if r.wrote then upd σ₂.onset (σ₁.stat + 1) o.fc else σ₂.onset) s := by
      intro s h1 h2
      rcases hshape with ⟨ho, hw⟩ | ⟨ho, hw⟩ | ⟨ho, _, hw⟩
      · simp only [hw]; exact hon s h1 (by omega)
      · simp only [hw, if_true, upd]
        by_cases hx : s = σ₁.stat + 1
        · simp [hx]
        · simp only [hx, if_false]; exact hon s h1 (by omega)
      · simp only [hw]; exact hon s h1 (by omega)
    have hro : 0 ≤ r.out := by rcases hshape with ⟨ho, _⟩ | ⟨ho, _⟩ | ⟨_, ho, _⟩ <;> omega
    have ⟨hc1, hc2⟩ := ioi_congr T.ioi σ₁.stat o.fc r.out _ _ hwf.2 hon1
    refine ⟨⟨hc1, rfl, rfl, rfl, ?_⟩, ioi_nonneg true T.ioi σ₁.stat o.fc r.out _ hs hro⟩
    intro s h1 h2
    exact hc2 s h1 (by simp only at h2 ⊢; omega)

theorem run_congr (T : Tab α) (hwf : WF T) (os : List (Obs α)) :
    ∀ σ₁ σ₂ : St α, Agree σ₁ σ₂ → 0 ≤ σ₁.stat → run true T σ₁ os = run true T σ₂ os := by
  induction os with
  | nil => intros; rfl
  | cons o os ih =>
    intro σ₁ σ₂ h hs
    have ⟨h', hs'⟩ := step_congr T hwf σ₁ σ₂ o h hs
    simp only [run]
    rw [h'.1, ih _ _ h' hs']

/-- Invariant of every state reachable with the fixed code: stat ≥ 0 and onset[0] = 0. -/
def Inv (σ : St α) : Prop := 0 ≤ σ.stat ∧ σ.onset 0 = 0

theorem step_inv (T : Tab α) (hwf : WF T) (σ : St α) (o : Obs α) (h : Inv σ) :
    Inv (step true T σ o) := by
  obtain ⟨hs, h0⟩ := h
  have hnn := (step_congr T hwf σ σ o ⟨rfl, rfl, rfl, rfl, fun _ _ _ => rfl⟩ hs).2
  refine ⟨hnn, ?_⟩
  by_cases hn : T.n = 0
  · simp [step, hn, h0]
  · simp only [step, hn, if_false]
    rw [ioi_keeps_low _ _ _ _ _ 0 hs]
    have key : ∀ (b : Bool), (if b = true then upd σ.onset (σ.stat + 1) o.fc else σ.onset) 0 = 0 := by
      intro b; cases b
      · simpa using h0
      · simp only [if_true, upd]; rw [if_neg (by omega)]; exact h0
    exact key _

theorem runState_inv (T : Tab α) (hwf : WF T) (os : List (Obs α)) :
    ∀ σ : St α, Inv σ → Inv (runState true T σ os) := by
  induction os with
  | nil => intro σ h; exact h
  | cons o os ih => intro σ h; exact ih _ (step_inv T hwf σ o h)

theorem session_inv (T : Tab α) (hwf : WF T) (rst : Bool) (trs : List (List (Obs α))) :
    ∀ σ : St α, Inv σ → Inv (session true rst T σ trs) := by
  induction trs with
  | nil => intro σ h; exact h
  | cons tr trs ih =>
    intro σ h
    apply ih
    apply runState_inv T hwf
    unfold trialReset; split <;> exact ⟨Int.le_refl _, h.2⟩

/-- **Main theorem (sufficiency of the two fixes).**  With the maxIOI write fixed (`[j]`) and
    `ostTab.reset()` called at trial start, the state sequence of a trial is the same as on a
    freshly loaded OST, whatever trials came before (any number, any inputs, with or without
    resets in between).  Holds for every well-formed table and every input type `α`. -/
theorem trial_independent (T : Tab α) (hwf : WF T) (rst : Bool) (before : List (List (Obs α)))
    (trial : List (Obs α)) :
    run true T (trialReset true (session true rst T load before)) trial =
    run true T (trialReset true load) trial := by
  have hi := session_inv T hwf rst before load ⟨Int.le_refl _, rfl⟩
  apply run_congr T hwf trial
  · refine ⟨rfl, rfl, rfl, rfl, ?_⟩
    intro s h1 h2
    simp [trialReset] at h2 ⊢
    have : s = 0 := by omega
    subst this; simp [load]; exact hi.2
  · simp [trialReset]

end Ost
