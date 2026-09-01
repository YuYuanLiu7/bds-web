// 前台頁面頂部「品牌色大橫幅」的質感疊層（純視覺、無互動）。
//
// 目的：讓純色橫幅不再死板——左上加一道很淡的光澤、右下加一點深度，
// 產生立體感但保持乾淨克制（非發光球那種花俏）。使用半透明黑白，
// 因此不綁死任何顏色、跟著後台品牌主色走，換色也不會壞。
//
// 用法：放在 `relative overflow-hidden` 的橫幅容器內、內容之前即可。
export default function HeroSheen() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.16),transparent_55%),linear-gradient(155deg,rgba(255,255,255,0.05),transparent_45%,rgba(0,0,0,0.22))]"
    />
  );
}
