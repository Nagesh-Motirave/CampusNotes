/**
 * AdBanner — reusable ad placeholder component.
 * Props: position ("top" | "inline" | "sidebar")
 * Renders a styled placeholder ready for Google AdSense integration.
 */
const AdBanner = ({ position = 'inline' }) => {
  const styles = {
    top: 'w-full h-24 md:h-28',
    inline: 'w-full h-20 md:h-24',
    sidebar: 'w-full h-64',
  };

  return (
    <div
      className={`${styles[position]} rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-1 text-gray-400`}
      role="complementary"
      aria-label="Advertisement"
    >
      <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
      <span className="text-xs font-medium tracking-wider uppercase">Advertisement</span>
      {/* Replace this div with Google AdSense script tag:
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
        <ins class="adsbygoogle" data-ad-client="YOUR_CLIENT_ID" data-ad-slot="YOUR_SLOT_ID"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      */}
    </div>
  );
};

export default AdBanner;
