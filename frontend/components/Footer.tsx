export default function Footer() {
  return (
    <footer className="bg-black/80 border-t border-neon-red/20 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold text-gradient mb-3">SinHuella Corp</h3>
            <p className="text-gray-400 text-sm mb-2">
              Anonymous cryptocurrency marketplace
            </p>
            <p className="text-gray-500 text-xs">
              Fast, Easy, Anonymous
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-neon-red mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-neon-red transition-colors text-sm">
                  Home
                </a>
              </li>
              <li>
                <a href="/#products" className="text-gray-400 hover:text-neon-red transition-colors text-sm">
                  Products
                </a>
              </li>
              <li>
                <a href="/profile" className="text-gray-400 hover:text-neon-red transition-colors text-sm">
                  My Orders
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold text-neon-red mb-3">Contact Us</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://t.me/yourtelegram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-neon-red transition-colors text-sm flex items-center gap-2"
                >
                  <span>📱</span> Telegram
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@sinhuella.com"
                  className="text-gray-400 hover:text-neon-red transition-colors text-sm flex items-center gap-2"
                >
                  <span>✉️</span> Email Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-neon-red/10 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} SinHuella Corp. All rights reserved.
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Powered by OxaPay | Secure Cryptocurrency Payments
          </p>
        </div>
      </div>
    </footer>
  );
}
