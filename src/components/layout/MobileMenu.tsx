import { Link } from "react-router-dom";
import { X, ChevronRight, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  scrollToSection?: (sectionId: string) => void;
}

const MobileMenu = ({ isOpen, onClose, scrollToSection }: MobileMenuProps) => {
  const handleNavClick = (sectionId: string) => {
    if (scrollToSection) {
      scrollToSection(sectionId);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999] lg:hidden"
        >
          {/* Backdrop - Semi-transparent to show page behind */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />

          {/* Menu Panel - Half screen from top, positioned below header */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute top-[60px] left-0 right-0 bg-white shadow-2xl flex flex-col overflow-hidden rounded-b-2xl"
            style={{ maxHeight: 'calc(50vh - 30px)' }}
          >
            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              {/* Features */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05, duration: 0.2 }}
                onClick={() => handleNavClick('features')}
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 group touch-manipulation"
              >
                <span className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Features
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </motion.button>

              {/* Pricing */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                onClick={() => handleNavClick('pricing')}
                className="w-full flex items-center justify-between py-4 border-b border-gray-100 group touch-manipulation"
              >
                <span className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Pricing
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </motion.button>

              {/* Developer */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
              >
                <Link
                  to="/developer"
                  onClick={onClose}
                  className="w-full flex items-center justify-between py-4 border-b border-gray-100 group touch-manipulation"
                >
                  <span className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Developer
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            </nav>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.2 }}
              className="px-4 py-4 bg-gray-50 border-t border-gray-100 space-y-2"
            >
              {/* Primary CTA - Get Started */}
              <Link to="/signup" onClick={onClose} className="block">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-full shadow-lg shadow-blue-600/20 transition-all duration-200 touch-manipulation flex items-center justify-center"
                >
                  Get Started
                </motion.button>
              </Link>

              {/* Secondary CTA - WhatsApp Chat */}
              <a
                href="https://wa.me/255614459923"
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
                className="block"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-full border border-gray-200 transition-all duration-200 touch-manipulation flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp Chat
                </motion.button>
              </a>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
