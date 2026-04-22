import type { Journey } from "../types";

export const alHujuratJourney: Journey = {
  id: "al-hujurat",
  surahName: "Surah Al-Hujurat",
  surahLabel: "49 · The Rooms",
  description:
    "A journey through adab, speech, community, and the ethics of dealing with others.",
  segments: [
    {
      id: "al-hujurat-1",
      ayahStart: 1,
      ayahEnd: 5,
      title: "Respect before speech",
      focusAnchor:
        "These ayat teach restraint, reverence, and adab before Allah and His Messenger.",
      arabic:
        "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تُقَدِّمُوا بَيْنَ يَدَيِ اللَّهِ وَرَسُولِهِ وَاتَّقُوا اللَّهَ ۚ إِنَّ اللَّهَ سَمِيعٌ عَلِيمٌ\nيَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَرْفَعُوا أَصْوَاتَكُمْ فَوْقَ صَوْتِ النَّبِيِّ وَلَا تَجْهَرُوا لَهُ بِالْقَوْلِ كَجَهْرِ بَعْضِكُمْ لِبَعْضٍ أَن تَحْبَطَ أَعْمَالُكُمْ وَأَنتُمْ لَا تَشْعُرُونَ\nإِنَّ الَّذِينَ يَغُضُّونَ أَصْوَاتَهُمْ عِندَ رَسُولِ اللَّهِ أُولَٰئِكَ الَّذِينَ امْتَحَنَ اللَّهُ قُلُوبَهُمْ لِلتَّقْوَىٰ ۚ لَهُم مَّغْفِرَةٌ وَأَجْرٌ عَظِيمٌ\nإِنَّ الَّذِينَ يُنَادُونَكَ مِن وَرَاءِ الْحُجُرَاتِ أَكْثَرُهُمْ لَا يَعْقِلُونَ\nوَلَوْ أَنَّهُمْ صَبَرُوا حَتَّىٰ تَخْرُجَ إِلَيْهِمْ لَكَانَ خَيْرًا لَّهُمْ ۚ وَاللَّهُ غَفُورٌ رَّحِيمٌ",
      translation:
        "O you who believe, do not put yourselves before Allah and His Messenger, and fear Allah. Surely Allah is All-Hearing, All-Knowing. O you who believe, do not raise your voices above the voice of the Prophet, nor speak loudly to him as you speak loudly to one another, lest your deeds become worthless while you do not perceive. Surely those who lower their voices before the Messenger of Allah are the ones whose hearts Allah has tested for taqwa. For them is forgiveness and a great reward. Indeed, those who call you from behind the chambers, most of them do not understand. And if they had been patient until you came out to them, it would have been better for them. And Allah is Forgiving, Merciful.",
      insights: [
        "These ayat build adab before speech by teaching restraint in the presence of revelation.",
        "Manners are not superficial here; they are tied directly to taqwa and the state of the heart.",
        "Patience and respect are shown as better than impulsiveness and demand.",
      ],
      questions: [
        {
          id: "al-hujurat-1-q1",
          type: "multiple_choice",
          prompt: "What quality do these ayat repeatedly teach?",
          options: ["Bold self-expression", "Restraint and reverence", "Social status"],
          correctAnswer: "Restraint and reverence",
          explanation:
            "The central lesson is not silence for its own sake, but disciplined adab before Allah and His Messenger.",
        },
      ],
      reflectionPrompt:
        "Where do you need more restraint in speech, tone, or impatience when dealing with others?",
      actionOptions: [
        "Lower my tone in one conversation today.",
        "Pause before speaking when I feel reactive.",
        "Practice patience instead of demanding an immediate response.",
      ],
    },
  ],
};