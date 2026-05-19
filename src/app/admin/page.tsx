import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from "lucide-react";

export default function AdminDashboardPage() {
  const stats = [
    { title: "總營收", value: "NT$ 128,400", change: "+12.5%", trend: "up", icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { title: "新學員", value: "42", change: "+18.2%", trend: "up", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "活躍課程", value: "12", change: "0%", trend: "neutral", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "轉換率", value: "3.2%", change: "-2.4%", trend: "down", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">控制台總覽</h1>
          <p className="text-slate-500 text-sm">歡迎回來！這是您網站今天的數據概況。</p>
        </div>
        <div className="flex space-x-3">
          <select className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option>最近 7 天</option>
            <option>最近 30 天</option>
            <option>本月</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">
            匯出報表
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-4">
              <div className={`${item.bg} ${item.color} p-3 rounded-xl group-hover:scale-110 transition`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center text-xs font-bold ${
                item.trend === 'up' ? 'text-green-500' : item.trend === 'down' ? 'text-red-500' : 'text-slate-400'
              }`}>
                {item.change}
                {item.trend === 'up' && <ArrowUpRight className="w-3 h-3 ml-1" />}
                {item.trend === 'down' && <ArrowDownRight className="w-3 h-3 ml-1" />}
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500 mb-1">{item.title}</div>
            <div className="text-2xl font-bold text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart Placeholder */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-900">銷售趨勢</h3>
            <div className="flex space-x-2">
              <span className="flex items-center text-xs text-slate-400"><div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div> 營收</span>
              <span className="flex items-center text-xs text-slate-400"><div className="w-2 h-2 bg-slate-200 rounded-full mr-1"></div> 預測</span>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between px-2">
            {[40, 70, 45, 90, 65, 85, 55, 75, 50, 95, 60, 80].map((h, i) => (
              <div key={i} className="w-full mx-1 group relative">
                <div 
                  className="bg-blue-500 rounded-t-sm group-hover:bg-blue-600 transition-all duration-500" 
                  style={{ height: `${h}%` }}
                ></div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                  {h * 100}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">最新動態</h3>
          <div className="space-y-6">
            {[
              { user: "陳小明", action: "購買了", target: "半導體入門課程", time: "2 分鐘前" },
              { user: "林美玲", action: "註冊了", target: "新帳號", time: "15 分鐘前" },
              { user: "張大衛", action: "完成了", target: "第一章節", time: "1 小時前" },
              { user: "王力宏", action: "購買了", target: "硬體 ODM 課程", time: "3 小時前" },
            ].map((act, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex-shrink-0 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-900">
                    <span className="font-bold">{act.user}</span> {act.action} <span className="font-medium text-blue-600">{act.target}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-blue-600 border border-blue-50 rounded-xl hover:bg-blue-50 transition">
            查看所有動態
          </button>
        </div>
      </div>
    </div>
  );
}
