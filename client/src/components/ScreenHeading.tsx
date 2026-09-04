/** Shared heading block for the non-home tabs. */
export function ScreenHeading({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="sky-txt px-6 pb-3 pt-3 lg:px-0 lg:pb-6 lg:pt-0">
      <h2 className="text-[27px] font-medium tracking-[-0.03em] lg:text-[38px]">{title}</h2>
      <p className="sky-txt-2 mt-1 max-w-[68ch] text-[12.5px] leading-[1.45] lg:mt-2 lg:text-[14px]">
        {blurb}
      </p>
    </div>
  );
}
