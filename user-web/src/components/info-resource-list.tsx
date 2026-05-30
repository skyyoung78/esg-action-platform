import type { InfoResource } from "@/lib/info-content";

export default function InfoResourceList({ items }: { items: InfoResource[] }) {
  return (
    <ul className="mt-4 space-y-4">
      {items.map((item) => (
        <li key={item.name} className="border border-slate-200 rounded-lg p-4">
          <p className="font-semibold text-[#111827]">{item.name}</p>
          <p className="mt-2 text-sm text-slate-700 leading-relaxed">{item.summary}</p>
          <ul className="mt-3 text-sm text-slate-600 space-y-1 list-disc pl-5">
            {item.highlights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 rounded-md bg-[#085041] text-white px-4 py-2 text-sm font-medium hover:bg-[#064036]"
          >
            공식 사이트 방문
          </a>
        </li>
      ))}
    </ul>
  );
}
