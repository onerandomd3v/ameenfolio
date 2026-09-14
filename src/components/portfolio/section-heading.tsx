type SectionHeadingProps = {
  id: string;
  title: string;
};

export function SectionHeading({ id, title }: SectionHeadingProps) {
  return (
    <header className="flex items-center">
      <h2
        id={id}
        className="text-[22px] font-medium tracking-[-0.035em] text-foreground"
      >
        {title}
      </h2>
    </header>
  );
}
