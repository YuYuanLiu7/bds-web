import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600 tracking-tight">
              BDS <span className="text-gray-900 font-medium text-lg">By Doing So</span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            <Link href="/courses" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              所有課程
            </Link>
            <Link href="/membership" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              會員方案
            </Link>
            <Link href="/articles" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              精選文章
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              登入
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              註冊
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
