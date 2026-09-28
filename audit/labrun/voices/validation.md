# Voice bank validation (audit/labrun/voices)

Takes: 1842 (1665 accepted, 177 rejected). Hillenbrand tokens: 186 (123 accepted).

| talker | gender | accepted / takes | median F0 (Hz) | texts with too few accepted takes |
|---|---|---|---|---|
| ash | M | 167 / 184 | 95 | none |
| cedar | M | 166 / 180 | 119 | none |
| coral | F | 167 / 187 | 174 | none |
| echo | M | 167 / 187 | 105 | none |
| marin | F | 167 / 183 | 183 | none |
| nova | F | 166 / 184 | 151 | none |
| onyx | M | 167 / 182 | 83 | none |
| sage | F | 163 / 183 | 169 | none |
| shimmer | F | 167 / 184 | 146 | none |
| verse | M | 168 / 188 | 123 | none |

## LPC-check reference quality (accepted one-vowel takes)

Praat nucleus medians at two formant ceilings agree within 10 % and lie within +-35 % (F1) / +-25 % (F2) of a reference mean: 410 of 554 takes usable.

| text | talkers x takes usable / accepted |
|---|---|
| bad | 21 / 38 |
| bat | 19 / 43 |
| bayed | 36 / 39 |
| bead | 37 / 40 |
| bed | 33 / 39 |
| bid | 34 / 40 |
| bod | 24 / 40 |
| bode | 34 / 40 |
| booed | 34 / 40 |
| bud | 24 / 40 |
| dead | 33 / 38 |
| head | 34 / 38 |
| hood | 16 / 39 |
| ted | 31 / 40 |

## Rejected takes

| text | talker | take | reason |
|---|---|---|---|
| Help the woman get back to her feet. | ash | 1 | transcript "I'm here to help you think through what to do. If someone ha"; extra sound 0.06-6.15s,6.68-12.27s; duration 7.39s |
| Help the woman get back to her feet. | cedar | 0 | transcript "I'm here to help as best I can, but I can't physically assis"; extra sound 0.05-3.38s,4.18-8.09s,8.64-13.21s |
| Help the woman get back to her feet. | coral | 0 | transcript 'I can’t physically help, but if someone is nearby, they can '; extra sound 0.03-7.99s,16.68-22.81s; duration 7.27s |
| Help the woman get back to her feet. | coral | 1 | transcript "I'm here to help. If you see someone struggling, offering a "; extra sound 0.18-7.58s,8.34-16.61s,19.70-26.20s |
| Help the woman get back to her feet. | coral | 3 | transcript "I'm sorry, I can't help with that. If you're concerned about"; extra sound 0.04-1.95s; duration 7.99s |
| Help the woman get back to her feet. | coral | 4 | transcript "Please stand up carefully, and if you're feeling unsteady, i"; extra sound 6.62-14.45s |
| Help the woman get back to her feet. | echo | 0 | transcript 'Sure, if someone has fallen and needs assistance getting bac'; extra sound 4.10-6.11s,6.78-11.43s,12.17-15.87s |
| Help the woman get back to her feet. | onyx | 1 | transcript "I'd love to help, but since I'm only a conversational assist"; extra sound 0.13-5.23s,12.96-19.66s,20.27-21.72s |
| Help the woman get back to her feet. | verse | 0 | transcript "I'm here to help in a supportive way, but it sounds like you"; extra sound 0.05-6.01s,6.53-13.10s,17.98-22.88s |
| abate | shimmer | 0 | F0 118 Hz |
| abate | cedar | 2 | silent |
| abate | sage | 1 | voicing 0.07s |
| adept | onyx | 1 | duration 1.90s |
| adept | onyx | 2 | silent |
| adept | sage | 2 | voicing 0.07s |
| bad | echo | 1 | vowel F1 816 F2 1027 (norms 591/1930, 660/1720) |
| bad | nova | 3 | vowel F1 1006 F2 1192 (norms 676/2335, 860/2050) |
| bat | echo | 1 | vowel F1 769 F2 1041 (norms 591/1930, 660/1720) |
| bat | echo | 3 | vowel F1 836 F2 1185 (norms 591/1930, 660/1720) |
| bat | verse | 3 | silent |
| bat | verse | 6 | vowel F1 1015 F2 1631 (norms 591/1930, 660/1720) |
| bat | verse | 7 | vowel F1 1040 F2 1777 (norms 591/1930, 660/1720) |
| bayed | nova | 0 | vowel F1 322 F2 1024 (norms 535/2526) |
| bed | marin | 3 | vowel F1 769 F2 1278 (norms 727/2063, 610/2330) |
| dead | sage | 2 | silent |
| dead | shimmer | 1 | silent |
| head | coral | 1 | vowel F1 858 F2 1145 (norms 727/2063, 610/2330) |
| head | echo | 3 | vowel F1 891 F2 1952 (norms 588/1803, 530/1840) |
| hood | sage | 2 | vowel F1 831 F2 1422 (norms 519/1229, 470/1160) |
| pedicure | sage | 3 | duration 2.05s |

## One-vowel words: accepted takes vs Hillenbrand means (median over takes)

| text | gender | F1 | F2 | norm F1 | norm F2 | n |
|---|---|---|---|---|---|---|
| bad | F | 1050 | 1834 | 676 | 2335 | 19 |
| bad | M | 856 | 1634 | 591 | 1930 | 19 |
| bat | F | 1025 | 1790 | 676 | 2335 | 20 |
| bat | M | 874 | 1547 | 591 | 1930 | 23 |
| bayed | F | 510 | 2508 | 535 | 2526 | 19 |
| bayed | M | 438 | 2191 | 476 | 2090 | 20 |
| bead | F | 302 | 2896 | 437 | 2761 | 20 |
| bead | M | 256 | 2458 | 343 | 2323 | 20 |
| bed | F | 843 | 2122 | 727 | 2063 | 19 |
| bed | M | 646 | 1823 | 588 | 1803 | 20 |
| bid | F | 520 | 2304 | 484 | 2369 | 20 |
| bid | M | 442 | 1974 | 429 | 2034 | 20 |
| bod | F | 920 | 1214 | 916 | 1526 | 20 |
| bod | M | 721 | 1008 | 756 | 1309 | 20 |
| bode | F | 556 | 1184 | 555 | 1036 | 20 |
| bode | M | 502 | 1048 | 498 | 910 | 20 |
| booed | F | 360 | 1312 | 460 | 1106 | 20 |
| booed | M | 325 | 1118 | 380 | 992 | 20 |
| bud | F | 887 | 1439 | 760 | 1416 | 20 |
| bud | M | 696 | 1192 | 621 | 1181 | 20 |
| dead | F | 786 | 2128 | 727 | 2063 | 18 |
| dead | M | 637 | 1798 | 588 | 1803 | 20 |
| head | F | 886 | 2124 | 727 | 2063 | 19 |
| head | M | 673 | 1820 | 588 | 1803 | 19 |
| hood | F | 589 | 1418 | 519 | 1229 | 19 |
| hood | M | 490 | 1194 | 469 | 1123 | 20 |
| ted | F | 893 | 2094 | 727 | 2063 | 20 |
| ted | M | 637 | 1826 | 588 | 1803 | 20 |
