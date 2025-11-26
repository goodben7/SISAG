import { Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-rdcGrayBorder mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display font-bold text-rdcTextPrimary mb-3">Liens utiles</h3>
            <ul className="space-y-2 text-sm text-rdcGrayText">
              <li><a className="hover:text-rdcBlue" href="#">FAQ</a></li>
              <li><a className="hover:text-rdcBlue" href="#">Contact</a></li>
              <li><a className="hover:text-rdcBlue" href="#">À propos</a></li>
              <li><a className="hover:text-rdcBlue" href="#">Mentions légales</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-bold text-rdcTextPrimary mb-3">Réseaux sociaux</h3>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="Facebook" className="p-2 rounded-lg border border-rdcGrayBorder hover:border-rdcBlue transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-rdcBlue"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.4V12h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4V12h2.6l-.4 2.9h-2.2v7A10 10 0 0 0 22 12Z"/></svg>
              </a>
              <a href="#" aria-label="Twitter" className="p-2 rounded-lg border border-rdcGrayBorder hover:border-rdcBlue transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-rdcBlue"><path d="M19.6 7.3c.8-.5 1.5-1.2 2-2-.8.4-1.6.7-2.4.8a4.2 4.2 0 0 0-7.2 3.8A11.9 11.9 0 0 1 3 6.5a4.2 4.2 0 0 0 1.3 5.6c-.7 0-1.3-.2-1.9-.5v.1a4.2 4.2 0 0 0 3.3 4.1c-.6.2-1.2.2-1.8.1a4.2 4.2 0 0 0 3.9 2.9A8.5 8.5 0 0 1 2 19.5a12 12 0 0 0 18.6-10.5v-.5z"/></svg>
              </a>
              <a href="#" aria-label="WhatsApp" className="p-2 rounded-lg border border-rdcGrayBorder hover:border-rdcBlue transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-rdcBlue"><path d="M20 3.9A9.9 9.9 0 0 0 4.3 18.4L3 21l2.8-.7a9.9 9.9 0 0 0 14.2-8.6 9.9 9.9 0 0 0 0-7.8Zm-7 16.2c-2.2 0-4.2-.8-5.7-2.3A8 8 0 0 1 12 4a8 8 0 0 1 8 8c0 4.4-3.6 8-8 8Zm4.6-5.9-1.3-.6c-.4-.2-.8-.3-1.1.1l-.6.7c-.3.3-.6.3-1 .2-1.4-.6-3-2-3.5-3.4-.2-.4 0-.7.2-1l.5-.7c.2-.4.1-.8-.1-1.2l-.6-1.3c-.3-.8-.9-.8-1.3-.8h-.6c-.4 0-.8.3-1 1a4.3 4.3 0 0 0-.2 1.3c0 1.1.4 2.2 1.3 3.2 1.5 1.8 3.9 3.4 5.9 4 .3.1.6.1.9.1.3 0 .7-.1 1-.4l.5-.4c.5-.4.6-1 .3-1.6Z"/></svg>
              </a>
            </div>
            
          </div>
          <div>
            <h3 className="font-display font-bold text-rdcTextPrimary mb-3">Contact</h3>
            <p className="text-sm text-rdcGrayText flex items-center gap-2"><Mail className="w-4 h-4"/> contact@sisag.cd</p>
            <p className="text-sm text-rdcGrayText flex items-center gap-2 mt-2"><Phone className="w-4 h-4"/> +243 XXX XXX XXX</p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-rdcGrayBorder text-center">
          <p className="text-sm text-rdcGrayText">© 2025 Gouvernement de la RDC – Tous droits réservés</p>
        </div>
      </div>
    </footer>
  );
}
