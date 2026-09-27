/- Concrete counterexample traces for the shipped OST code (and the same traces under the fixes).
   rms values are Int here (any ordered type works for the model; the theorems in Ost.lean are
   generic).  One frame = one osTrack call; frame_counter = data_counter = frame index. -/
import Ost
namespace Ost.Cex
set_option maxRecDepth 200000
open Ost

instance : Num Int := ⟨fun a b => decide (a < b), fun a b => decide (a ≤ b), (· + ·), id⟩

/-- frame i of a trial whose speech (rms 20, threshold 10) spans frames [a, b) -/
def frame (a b : Int) (i : Int) : Obs Int :=
  { dc := i, fc := i, rms := if a ≤ i ∧ i < b then 20 else 0, slp := 0, inv := 0,
    hist := fun j => if a ≤ j ∧ j < b then 20 else 0 }
def trial (len : Nat) (a b : Int) : List (Obs Int) := (List.range len).map (fun (i : Nat) => frame a b (Int.ofNat i))

/-- first frame index at which the state equals `s` -/
def firstAt (s : Int) (xs : List Int) : Option Nat := xs.findIdx? (· == s)

/-! ### CE1: lastStatEnd leaks across trials (OST-F1)
  0 ELAPSED_TIME (4 frames)  →  1 INTENSITY_FALL (thr 10, minDur 5 frames)  →  2 OST_END      -/
def T1 : Tab Int :=
  { n := 3, stat0 := fun i => [0, 1, 2, 100].getD i 100,
    mode := fun i => [Mode.ELAPSED_TIME, Mode.FALL, Mode.END].getD i Mode.END,
    p1 := fun _ => 10, p2 := fun _ => 0, p3 := fun _ => 0,
    minDur := fun _ => 5, elapsedGT := fun _ x => decide (x > 3), nLB := 5, floor0 := 0, ioi := [] }

def trialA := trial 60 5 50      -- long utterance: speech frames 5..49
def trialB := trial 40 5 15      -- short utterance: speech frames 5..14

-- Fresh OST: offset of trial B (state 2) detected at frame 19 (speech ended at 15).
theorem ce1_fresh : firstAt 2 (run true T1 (trialReset false load) trialB) = some 19 := by decide
-- Shipped code (no ostTab.reset) after trial A: the offset is never detected in trial B.
theorem ce1_leak :
    firstAt 2 (run true T1 (trialReset false (session true false T1 load [trialA])) trialB) = none := by decide
-- With ostTab.reset() at trial start: identical to fresh (an instance of `trial_independent`).
theorem ce1_fixed :
    firstAt 2 (run true T1 (trialReset true (session true true T1 load [trialA])) trialB) = some 19 := by decide

/-! ### CE2: maxIOI writes statOnsetIndices[stat] instead of [j] (OST-F2)
  0 INTENSITY_RISE_HOLD (thr 10, hold 2) → 2 ELAPSED_TIME (> 5 frames) → 3 OST_END;
  maxIOI: from state 0, if more than 10 frames pass, jump to state 2.                        -/
def T2 : Tab Int :=
  { n := 3, stat0 := fun i => [0, 2, 3, 100].getD i 100,
    mode := fun i => [Mode.RISE_HOLD, Mode.ELAPSED_TIME, Mode.END].getD i Mode.END,
    p1 := fun _ => 10, p2 := fun _ => 0, p3 := fun _ => 0,
    minDur := fun _ => 2, elapsedGT := fun _ x => decide (x > 5), nLB := 5, floor0 := 0,
    ioi := [{ s0 := 0, exceeds := fun x => decide (x > 10), s1 := 2 }] }

def silent := trial 40 100 100    -- no speech: the timeout path

-- Fixed code: timeout at frame 11 → state 2; ELAPSED_TIME (5 frames) then fires at frame 17.
theorem ce2_fixed : (firstAt 2 (run true T2 (trialReset true load) silent),
                     firstAt 3 (run true T2 (trialReset true load) silent)) = (some 11, some 17) := by decide
-- Shipped code, first trial: state 2's onset is never set, so ELAPSED_TIME fires 1 frame later.
theorem ce2_bug_trial1 : (firstAt 2 (run false T2 (trialReset true load) silent),
                          firstAt 3 (run false T2 (trialReset true load) silent)) = (some 11, some 12) := by decide
-- Shipped code, even WITH ostTab.reset(): onset[0] was overwritten, so the timeout drifts
-- 11 → 22 → 33 frames on successive identical trials.
theorem ce2_bug_drift :
    (firstAt 2 (run false T2 (trialReset true (session false true T2 load [silent])) silent),
     firstAt 2 (run false T2 (trialReset true (session false true T2 load [silent, silent])) silent))
    = (some 22, some 33) := by decide
-- Fixed code: identical on every trial.
theorem ce2_fixed_repeat :
    firstAt 2 (run true T2 (trialReset true (session true true T2 load [silent, silent])) silent) = some 11 := by decide

end Ost.Cex
