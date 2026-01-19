"use client"

interface WordCloudProps {
  words: { text: string; value: number }[];
}

export function WordCloud({ words }: WordCloudProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 p-4">
      {words.length === 0 ? (
        <p className="text-gray-500">No words to display yet.</p>
      ) : (
        words.map((word, index) => (
          <span
            key={index}
            style={{ fontSize: `${1 + word.value * 0.5}rem`, opacity: 0.8 + word.value * 0.02 }}
            className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 font-semibold"
          >
            {word.text}
          </span>
        ))
      )}
    </div>
  );
}
