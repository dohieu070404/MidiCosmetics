export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      Bỏ qua để đến nội dung chính
    </a>
  );
}
