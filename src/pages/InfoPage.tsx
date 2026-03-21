import { PageWrapper } from '../components/layout/PageWrapper';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Info, HelpCircle, Code, ShieldCheck, Mail, BookOpen, MessageSquare, Utensils, LayoutDashboard, Instagram, Phone } from 'lucide-react';

export function InfoPage() {
  const version = "2.5.0 (Build 2026.03)";
  const creator = "Erik Misael";
  const instagram = "https://www.instagram.com/erik_16_qm?igsh=YzNyZnptMW1tNWw=";
  const email = "qmisael386@gmail.com";
  const phone = "51916738232";

  const faqs = [
    {
      question: "¿Cómo actualizo la Carta Digital?",
      answer: "La Carta Digital se sincroniza automáticamente con la base de datos central. Si realizaste un cambio reciente en el sistema de Google Sheets, simplemente ve a la sección 'Carta Digital' y presiona el botón 'Sincronizar'."
    },
    {
      question: "¿Quién puede añadir nuevos usuarios administradores?",
      answer: "Solo el Creador Supremo y los Administradores autorizados pueden gestionar los permisos de otros usuarios desde la pestaña 'Configuración'."
    },
    {
      question: "¿Qué es Marley IA?",
      answer: "Marley IA es tu asistente inteligente integrado. Puedes preguntarle sobre recetas, gestión del restaurante, atención al cliente o cualquier duda operativa del Chifa Brillo El Sol."
    },
    {
      question: "¿Cómo funciona el sistema de puntos y rangos?",
      answer: "A medida que interactúas con la plataforma, completas evaluaciones y ayudas en la gestión, acumulas puntos de experiencia (XP) que te permitirán subir de rango, desde 'Aprendiz' hasta 'Gran Maestro'."
    }
  ];

  const features = [
    { icon: LayoutDashboard, title: "Dashboard", desc: "Vista general de tu perfil, estadísticas y accesos rápidos." },
    { icon: MessageSquare, title: "Marley IA", desc: "Asistente virtual para resolver dudas operativas al instante." },
    { icon: Utensils, title: "Carta Digital", desc: "Catálogo completo y actualizado de todos los platos y combos." },
    { icon: BookOpen, title: "Diccionario", desc: "Glosario de términos culinarios y operativos del restaurante." }
  ];

  return (
    <PageWrapper className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center">
          <Info className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-gold-champagne" />
          INFO <span className="gold-text ml-2">& AYUDA</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-widest">
          Centro de Soporte y Detalles del Sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - About & Contact */}
        <div className="space-y-6 lg:col-span-1">
          <PremiumCard className="p-6">
            <div className="flex items-center mb-4">
              <Code className="w-5 h-5 text-dragon-red mr-2" />
              <h2 className="font-heading font-bold text-lg">Acerca del Sistema</h2>
            </div>
            <div className="space-y-4 text-sm text-gray-300">
              <p>
                Plataforma de gestión integral diseñada exclusivamente para el 
                <strong className="text-gold-champagne"> Chifa Brillo El Sol</strong>. 
                Optimiza la atención, capacita al personal y centraliza la información.
              </p>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Versión:</span>
                  <span className="text-white">{version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Creador:</span>
                  <span className="text-gold-champagne font-bold">{creator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estado:</span>
                  <span className="text-emerald-400">Operativo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Licencia:</span>
                  <span className="text-white">Exclusiva</span>
                </div>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6">
            <div className="flex items-center mb-4">
              <ShieldCheck className="w-5 h-5 text-dragon-red mr-2" />
              <h2 className="font-heading font-bold text-lg">Soporte & Créditos</h2>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              ¿Encontraste un error o necesitas ayuda adicional? Contacta directamente al desarrollador:
            </p>
            
            <div className="space-y-3">
              <a 
                href={`mailto:${email}`} 
                className="flex items-center w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-xl transition-all text-sm font-medium group"
              >
                <div className="bg-dragon-red/20 p-2 rounded-lg mr-3 group-hover:bg-dragon-red/30 transition-colors">
                  <Mail className="w-4 h-4 text-dragon-red" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Correo Electrónico</span>
                  <span>{email}</span>
                </div>
              </a>

              <a 
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-xl transition-all text-sm font-medium group"
              >
                <div className="bg-pink-500/20 p-2 rounded-lg mr-3 group-hover:bg-pink-500/30 transition-colors">
                  <Instagram className="w-4 h-4 text-pink-500" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Instagram</span>
                  <span>@erik_16_qm</span>
                </div>
              </a>

              <a 
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-xl transition-all text-sm font-medium group"
              >
                <div className="bg-emerald-500/20 p-2 rounded-lg mr-3 group-hover:bg-emerald-500/30 transition-colors">
                  <Phone className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">WhatsApp / Teléfono</span>
                  <span>+{phone}</span>
                </div>
              </a>
            </div>
          </PremiumCard>
        </div>

        {/* Right Column - Guide & FAQ */}
        <div className="space-y-6 lg:col-span-2">
          <PremiumCard className="p-6">
            <div className="flex items-center mb-6">
              <BookOpen className="w-5 h-5 text-dragon-red mr-2" />
              <h2 className="font-heading font-bold text-lg">Módulos Principales</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feat, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start">
                  <div className="bg-black/30 p-2 rounded-lg mr-3 shrink-0">
                    <feat.icon className="w-5 h-5 text-gold-champagne" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white mb-1">{feat.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </PremiumCard>

          <PremiumCard className="p-6">
            <div className="flex items-center mb-6">
              <HelpCircle className="w-5 h-5 text-dragon-red mr-2" />
              <h2 className="font-heading font-bold text-lg">Preguntas Frecuentes</h2>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                  <h3 className="font-bold text-sm text-gold-champagne mb-2">{faq.question}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </PremiumCard>
        </div>
      </div>
    </PageWrapper>
  );
}
