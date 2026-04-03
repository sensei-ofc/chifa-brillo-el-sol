import { PageWrapper } from '../components/layout/PageWrapper';
import { PremiumCard } from '../components/ui/PremiumCard';
import { CONFIG } from '../config';
import { Info, HelpCircle, Code, ShieldCheck, Mail, BookOpen, MessageSquare, Utensils, LayoutDashboard, Instagram, Phone, Trophy, Award, IdCard, Share2, Download, GraduationCap } from 'lucide-react';

export function InfoPage() {
  const version = CONFIG.app.version;
  const creator = CONFIG.creator.name;
  const instagram = CONFIG.social.instagram;
  const email = CONFIG.creator.email;
  const phone = CONFIG.contact.phone.replace(/\D/g, '');

  const faqs = [
    {
      question: "¿Cómo funciona el sistema de Gamificación?",
      answer: "A medida que interactúas con la plataforma y completas evaluaciones, acumulas puntos de experiencia (XP). Estos puntos te permiten subir de rango, desde 'Novato' hasta 'Leyenda Imperial', desbloqueando logros exclusivos."
    },
    {
      question: "¿Para qué sirve mi Credencial Digital?",
      answer: "Tu Credencial Digital es tu identificación oficial dentro del Chifa Brillo El Sol. Muestra tu rango actual, puntos y rol. Puedes descargarla como imagen o compartirla directamente desde tu Perfil."
    },
    {
      question: "¿Cómo actualizo la Carta Digital?",
      answer: "La Carta Digital se gestiona desde el módulo 'Menú'. Los administradores pueden añadir, editar o eliminar platos y categorías en tiempo real, y los cambios se reflejarán instantáneamente para todo el personal."
    },
    {
      question: "¿Qué es Marley IA?",
      answer: "Marley IA es tu asistente inteligente integrado. Puedes preguntarle sobre recetas, gestión del restaurante, atención al cliente o cualquier duda operativa del Chifa Brillo El Sol."
    },
    {
      question: "¿Cómo puedo obtener más puntos XP?",
      answer: "Participando activamente en el módulo de 'Capacitación', completando los quizzes de conocimiento sobre el menú y las operaciones del restaurante con la mayor puntuación posible."
    }
  ];

  const features = [
    { icon: LayoutDashboard, title: "Dashboard", desc: "Vista general de tu perfil, estadísticas y accesos rápidos." },
    { icon: IdCard, title: "Perfil y Credencial", desc: "Gestiona tu información y obtén tu credencial digital descargable." },
    { icon: GraduationCap, title: "Capacitación", desc: "Módulo de aprendizaje interactivo con quizzes y recompensas (XP)." },
    { icon: Utensils, title: "Carta Digital", desc: "Catálogo completo y actualizado de todos los platos y combos." },
    { icon: MessageSquare, title: "Marley IA", desc: "Asistente virtual para resolver dudas operativas al instante." },
    { icon: BookOpen, title: "Diccionario", desc: "Glosario de términos culinarios y operativos del restaurante." }
  ];

  const gamificationInfo = [
    { icon: Trophy, title: "Sistema de Rangos", desc: "Progresa a través de múltiples niveles basados en tu experiencia y conocimiento." },
    { icon: Award, title: "Logros Desbloqueables", desc: "Obtén medallas especiales por hitos como 'Primera Evaluación' o 'Racha Perfecta'." },
    { icon: Share2, title: "Comparte tu Éxito", desc: "Exporta tu credencial con tu rango actual y compártela con tus compañeros." }
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - About & Contact */}
        <div className="space-y-6 xl:col-span-1">
          <PremiumCard className="p-6">
            <div className="flex items-center mb-4">
              <Code className="w-5 h-5 text-dragon-red mr-2" />
              <h2 className="font-heading font-bold text-lg">Acerca del Sistema</h2>
            </div>
            <div className="space-y-4 text-sm text-gray-300">
              <p>
                Plataforma de gestión integral y gamificada diseñada exclusivamente para el 
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
        <div className="space-y-6 xl:col-span-2">
          
          {/* Gamification Section */}
          <PremiumCard className="p-6 border-gold-champagne/30">
            <div className="flex items-center mb-6">
              <Trophy className="w-6 h-6 text-gold-champagne mr-2" />
              <h2 className="font-heading font-bold text-xl text-gold-champagne">Novedades: Gamificación y Credenciales</h2>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              El sistema ahora incluye un completo motor de gamificación para premiar tu esfuerzo y conocimiento.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {gamificationInfo.map((info, idx) => (
                <div key={idx} className="bg-black/40 border border-gold-champagne/20 p-4 rounded-xl flex flex-col items-center text-center hover:border-gold-champagne/50 transition-colors">
                  <div className="bg-gold-champagne/10 p-3 rounded-full mb-3">
                    <info.icon className="w-6 h-6 text-gold-champagne" />
                  </div>
                  <h3 className="font-bold text-sm text-white mb-2">{info.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{info.desc}</p>
                </div>
              ))}
            </div>
          </PremiumCard>

          <PremiumCard className="p-6">
            <div className="flex items-center mb-6">
              <BookOpen className="w-5 h-5 text-dragon-red mr-2" />
              <h2 className="font-heading font-bold text-lg">Módulos Principales</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feat, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start hover:bg-white/10 transition-colors">
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
                <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:border-white/20 transition-colors">
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
