#!/usr/bin/env python3
"""hookscore.py - score a YouTube hook before you waste a take on it.

Five properties, 0-100 each, and a verdict that is 60% the mean and 40% the weakest one. The
weakest-link weighting is deliberate: a hook with four strong properties and one dead one is a hook
that leaks at the dead one, and averaging hides that.

    python3 hookscore.py hooks.txt            # one hook per line, ranked
    python3 hookscore.py --hook "one line"    # score a single hook
    python3 hookscore.py --json hooks.txt     # machine-readable

WHAT THIS CAN AND CANNOT TELL YOU. Measured against 74 real short-form hooks (first 15 seconds of
auto-captions, top-8 and bottom-8 by views across five channels): it separates deliberately bad
hooks from real ones well, and it separates a creator's own hits from their own misses barely at
all. Treat a low score as a reason to look again, never a high score as a promise.

ARABIC. A hook written mostly in Arabic letters is normalized and scored with Arabic word lists
(Modern Standard and Egyptian) and the match_ar patterns in hooks.json. The weights are the same
as for English; the Arabic lists and the 7-20 word band were not measured against real hooks, so
read an Arabic score as a rough comparison between your own options. Arabic has no capital letters,
so named things earn no specificity bonus there.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
FORMULAS = json.load(open(os.path.join(HERE, "hooks.json")))["hooks"]

FILLER = {"basically","actually","literally","just","really","very","so","kind","sort","like",
          "guys","hey","welcome","today","video","subscribe","channel"}
VAGUE = {"amazing","incredible","insane","crazy","huge","massive","game","changer","secret",
         "powerful","ultimate","best","revolutionary","mind","blowing","unbelievable"}
CONCRETE = re.compile(r"\b(\d[\d,.]*\s?(%|k|m|x|s|m|h)?|\$\d|\d+\s?(second|minute|hour|day|week|month|year)s?)\b", re.I)
YOU = re.compile(r"\b(you|your|you're|youre|yourself)\b", re.I)
STAKE = re.compile(r"\b(lose|lost|wasting|waste|quit|fail|broke|cost|risk|before|stop|never|die|dying|dead)\b", re.I)
CURIOSITY = re.compile(r"\b(why|how|what|which|until|before|but|nobody|almost|except|reason|actually)\b", re.I)

def words(t): return re.findall(r"[a-z0-9'%$.]+", t.lower())

# --- Arabic -------------------------------------------------------------------------------------
# Every Arabic list below is written in normalized form (see normalize_ar).
AR_LETTER = re.compile(r"[ء-ي]")
AR_DIACRITICS = re.compile(r"[ؐ-ًؚ-ٰٟـ]")
AR_MAP = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ة": "ه", "ى": "ي", "؟": "?",
                        "٪": "%", "،": ",", "؛": ";",
                        **{chr(0x0660 + i): str(i) for i in range(10)},
                        **{chr(0x06F0 + i): str(i) for i in range(10)}})

def is_arabic(t):
    return len(AR_LETTER.findall(t)) > len(re.findall(r"[A-Za-z]", t))

def normalize_ar(t): return AR_DIACRITICS.sub("", t).translate(AR_MAP)

def ar_words(t): return re.findall(r"[ء-ي0-9%]+", t)

def ar_forms(w):
    """The word plus the forms left after peeling clitics: و/ف, then ب/ل/ك/ه(future)/لل, then ال,
    then one present-tense prefix (ت/ي/ن/ا). Lists are matched against any of these."""
    out = {w}
    for a in [w] + ([w[1:]] if len(w) > 3 and w[0] in "وف" else []):
        out.add(a)
        for p in ("لل", "ب", "ل", "ك", "ه"):
            if a.startswith(p) and len(a) - len(p) >= 2: out.add(a[len(p):])
    for a in list(out):
        if a.startswith("ال") and len(a) > 3: out.add(a[2:])
    for a in list(out):
        if a[:1] in "تينا" and len(a) > 3: out.add(a[1:])
    return out

def ar_has(w, exact=(), stems=()):
    return any(f in exact or any(f.startswith(s) for s in stems) for f in ar_forms(w))

AR_FILLER = {"يعني", "بصراحه", "اصلا", "فعلا", "جدا", "خالص", "اهلا", "مرحبا", "النهارده",
             "فيديو", "الفيديو", "اشترك", "اشتركوا", "القناه", "قناتي", "جماعه", "ياجماعه", "شباب"}
AR_VAGUE = {"رهيب", "مذهل", "مدهش", "جامد", "عظيم", "مجنون", "جنوني", "ضخم", "هائل", "هايل", "سر",
            "اسرار", "افضل", "احسن", "اقوي", "خرافي", "عجيب", "خارق", "ثوري", "اسطوري"}
AR_NUMBERS = {"اتنين", "اثنين", "اثنان", "تلات", "تلاته", "ثلاث", "ثلاثه", "اربع", "اربعه", "خمس",
              "خمسه", "سته", "سبع", "سبعه", "تمانيه", "ثمان", "ثمانيه", "تسع", "تسعه", "عشر", "عشره",
              "حداشر", "اتناشر", "عشرين", "تلاتين", "ثلاثين", "اربعين", "خمسين", "ستين", "سبعين",
              "تمانين", "ثمانين", "تسعين", "ميه", "مئه", "مائه", "الف", "الاف", "مليون", "ملايين",
              "نص", "ربع", "دقيقتين", "ساعتين", "يومين", "اسبوعين", "شهرين", "سنتين"}
AR_YOU = {"انت", "انتي", "انتو", "انتوا", "انتم", "انتما", "انتن", "حضرتك", "حضرتكم", "نفسك",
          "نفسكم", "ليك", "ليكي", "ليكم", "لك", "لكم", "عندك", "عندكم", "بتاعك", "بتاعتك", "معاك",
          "معاكم", "منك", "عليك", "عليكم", "فيك", "اياك"}
# words that end in ك but are not "your"
AR_NOT_YOU = {"ذلك", "كذلك", "هناك", "هنالك", "تلك", "اولئك", "مبارك", "ملك", "بنك", "شباك",
              "شبابيك", "مشترك", "مشارك", "سمك", "ضحك", "تحرك", "محرك", "ترك", "مدرك", "فلك",
              "سلك", "شك", "شوك", "ديك", "مسك", "مالك", "هلاك", "مستهلك", "سلوك", "ملوك", "ادراك"}
AR_STAKE_EXACT = {"قبل", "ابدا", "ثمن", "خطر", "خطير", "غلط", "غلطه", "خطا", "اخطاء", "فات", "فاتك",
                  "موت", "ميت", "ضياع", "ضايع"}
AR_STAKE_STEMS = ("خسر", "خسار", "ضيع", "بطل", "توقف", "فشل", "فاشل", "ندم", "تكلف", "يموت", "تموت",
                  "يفوت", "تفوت", "يقع", "تقع", "بيقع", "وقع")
AR_CURIOSITY = {"ليه", "لماذا", "ليش", "ازاي", "كيف", "ايه", "ماذا", "انهي", "مين", "لحد", "حتي",
                "قبل", "بس", "لكن", "محدش", "ماحدش", "تقريبا", "الا", "السبب", "سبب", "فعلا", "لغايه"}
AR_CLOSED = re.compile(r"(?<![ء-ي])(لان|لانه|لانك|علشان|عشان|بحيث|لذلك)(?![ء-ي])")

def ar_you_count(t, first_only=False):
    n = 0.0
    for w in ar_words(t)[:6] if first_only else ar_words(t):
        core = w[1:] if len(w) > 3 and w[0] in "وف" else w
        if ar_has(w, AR_YOU): n += 1
        elif (len(core) >= 4 and not core.startswith("ال") and core not in AR_NOT_YOU
              and (core.endswith("ك") or core.endswith("كم") or core.endswith("كي"))): n += 1
        # Egyptian present tense: بت/هت + verb is usually "you" (sometimes "she")
        elif core[:2] in ("بت", "هت") and len(core) >= 4: n += 0.5
    return n

def ar_concrete(t):
    return len(re.findall(r"\d[\d,.]*", t)) + \
        sum(1 for w in ar_words(t) if not w[0].isdigit() and ar_has(w, AR_NUMBERS))

def specificity_ar(t):
    w = ar_words(t)
    if not w: return 0
    vague = sum(1 for x in w if ar_has(x, AR_VAGUE))
    filler = sum(1 for x in w if ar_has(x, AR_FILLER))
    return max(0, min(100, 34 + ar_concrete(t) * 22 - vague * 16 - filler * 5))

def address_ar(t):
    first = 30 if ar_you_count(t, first_only=True) else 0
    return max(0, min(100, round(26 + ar_you_count(t) * 20 + first)))

def stakes_ar(t):
    n = sum(1 for w in ar_words(t) if ar_has(w, AR_STAKE_EXACT, AR_STAKE_STEMS))
    return max(0, min(100, 22 + n * 26 + (14 if ar_concrete(t) else 0)))

def curiosity_ar(t):
    n = sum(1 for w in ar_words(t) if ar_has(w, AR_CURIOSITY))
    q = 18 if t.strip().endswith("?") else 0
    closed = -18 if AR_CLOSED.search(t) else 0
    return max(0, min(100, 24 + n * 17 + q + closed))

def brevity_ar(t):
    n = len(ar_words(t))
    if n == 0: return 0
    # Arabic glues pronouns and prepositions onto words, so the same spoken hook runs about a
    # quarter fewer words than in English: the 9-24 band becomes 7-20.
    if 7 <= n <= 20: return 100
    if n < 7:  return max(30, 100 - (7 - n) * 11)
    return max(10, 100 - (n - 20) * 7)
# ------------------------------------------------------------------------------------------------

def specificity(t):
    w = words(t)
    if not w: return 0
    nums = len(CONCRETE.findall(t))
    vague = sum(1 for x in w if x in VAGUE)
    filler = sum(1 for x in w if x in FILLER)
    s = 34 + nums * 22 - vague * 16 - filler * 5
    # proper nouns that are not sentence-initial read as named things
    s += min(18, 6 * sum(1 for x in t.split()[1:] if x[:1].isupper()))
    return max(0, min(100, s))

def address(t):
    n = len(YOU.findall(t))
    first = 30 if YOU.search(" ".join(t.split()[:6])) else 0
    return max(0, min(100, 26 + n * 20 + first))

def stakes(t):
    n = len(STAKE.findall(t))
    return max(0, min(100, 22 + n * 26 + (14 if CONCRETE.search(t) else 0)))

def curiosity(t):
    n = len(CURIOSITY.findall(t))
    q = 18 if t.strip().endswith("?") else 0
    # a hook that resolves itself has no gap left
    closed = -18 if re.search(r"\b(because|so that|which means)\b", t, re.I) else 0
    return max(0, min(100, 24 + n * 17 + q + closed))

def brevity(t):
    n = len(words(t))
    if n == 0: return 0
    # 9-24 words is the band a spoken hook lands in at ~150wpm inside 10 seconds
    if 9 <= n <= 24: return 100
    if n < 9:  return max(30, 100 - (9 - n) * 11)
    return max(10, 100 - (n - 24) * 7)

PROPS = [("SPECIFICITY", specificity), ("ADDRESS", address), ("STAKES", stakes),
         ("CURIOSITY", curiosity), ("BREVITY", brevity)]
PROPS_AR = [("SPECIFICITY", specificity_ar), ("ADDRESS", address_ar), ("STAKES", stakes_ar),
            ("CURIOSITY", curiosity_ar), ("BREVITY", brevity_ar)]

def classify(t, key="match"):
    best, hits = None, 0
    for f in FORMULAS:
        n = sum(1 for p in f.get(key, []) if re.search(p, t, re.I))
        if n > hits: best, hits = f, n
    return (best["name"] if best else "Unclassified"), hits

def score(t):
    ar = is_arabic(t)
    if ar: t = normalize_ar(t).strip()
    parts = {n: fn(t) for n, fn in (PROPS_AR if ar else PROPS)}
    vals = list(parts.values())
    verdict = round(0.6 * (sum(vals) / len(vals)) + 0.4 * min(vals))
    name, hits = classify(t, "match_ar" if ar else "match")
    return parts, verdict, name, hits

def band(v): return "STRONG" if v >= 72 else "WORKABLE" if v >= 55 else "WEAK"

def report(t, parts, verdict, name, hits):
    print(f"\n  {t.strip()}")
    print(f"  {'-' * min(72, max(20, len(t.strip())))}")
    for k, v in parts.items():
        print(f"    {k:<12} {v:3d}  {'#' * (v // 5)}")
    print(f"    {'VERDICT':<12} {verdict:3d}  {band(verdict)}")
    print(f"    formula      {name}" + (f"  ({hits} pattern{'s' if hits != 1 else ''} matched)" if hits else "  (no formula matched - that is usually a summary, not a hook)"))
    low = min(parts, key=parts.get)
    print(f"    weakest      {low} - {(FIX_AR if is_arabic(t) else FIX)[low]}")

FIX = {
 "SPECIFICITY": "swap one adjective for a number, a name or a date",
 "ADDRESS": "say 'you' in the first six words",
 "STAKES": "name what it costs them to keep doing it the current way",
 "CURIOSITY": "cut the half of the sentence that answers itself",
 "BREVITY": "9 to 24 words. Read it out loud and stop where you run out of breath",
}
FIX_AR = {
 "SPECIFICITY": "بدّل صفة عامة برقم أو اسم أو تاريخ",
 "ADDRESS": "كلّم المشاهد (انت، ليك، بتعمل) في أول ست كلمات",
 "STAKES": "قول هيخسر إيه لو فضل يعمل نفس الحاجة",
 "CURIOSITY": "شيل نص الجملة اللي بيجاوب على نفسه",
 "BREVITY": "من 7 لـ 20 كلمة. اقراها بصوت عالي ووقف لما نفسك يخلص",
}

def main():
    a = sys.argv[1:]
    as_json = "--json" in a
    a = [x for x in a if x != "--json"]
    if "--hook" in a:
        lines = [a[a.index("--hook") + 1]]
    elif a and os.path.exists(a[0]):
        lines = [l for l in open(a[0]).read().splitlines() if l.strip()]
    else:
        print(__doc__); sys.exit(1 if not a else 0)
    out = []
    for t in lines:
        parts, verdict, name, hits = score(t)
        out.append({"hook": t.strip(), "properties": parts, "verdict": verdict,
                    "band": band(verdict), "formula": name, "matched": hits})
    out.sort(key=lambda r: -r["verdict"])
    if as_json:
        print(json.dumps([{k: v for k, v in r.items() if k != "matched"} for r in out], indent=1)); return
    for r in out:
        report(r["hook"], r["properties"], r["verdict"], r["formula"], r["matched"])
    if len(out) > 1:
        print(f"\n  winner: {out[0]['hook'].strip()}  ({out[0]['verdict']}, {out[0]['band']})\n")

if __name__ == "__main__":
    main()
