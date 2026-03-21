import { useState, useRef, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Send, Bot, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useAuthStore } from '../store/useAuthStore';
import { useMenuStore } from '../store/useMenuStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GuestBlocker } from '../components/auth/GuestBlocker';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export function ChatPage() {
  const { userRole, localGuest } = useAuthStore();
  
  if (userRole === 'guest') {
    return (
      <PageWrapper>
        <GuestBlocker 
          title="ACCESO DENEGADO" 
          description="Marley IA es un asistente exclusivo para el staff registrado. Inicia sesión para consultar dudas sobre el menú, recetas y atención al cliente."
        />
      </PageWrapper>
    );
  }

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: '¡Hola! Soy Marley, el asistente de IA experto en la cultura y menú del Chifa Brillo El Sol. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { items: menuData, isLoaded: isMenuLoaded, fetchMenu } = useMenuStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    if (!isMenuLoaded) {
      fetchMenu();
    }
  }, [isMenuLoaded, fetchMenu]);

  useEffect(() => {
    if (menuData.length > 0 && !chatRef.current) {
      const menuContext = menuData.map(item => 
        `- ${item.name} (${item.category}${item.subCategory ? ` - ${item.subCategory}` : ''}): ${item.description}. Precio: S/ ${item.price}. ${item.flavor ? `Sabor: ${item.flavor}` : ''}`
      ).join('\n');

      chatRef.current = ai.chats.create({
        model: 'gemini-3.1-flash-lite-preview',
        config: {
          systemInstruction: `Eres Marley, un asistente experto en cocina Chifa (fusión peruano-china) y específicamente del restaurante "Chifa Brillo El Sol". 
          
          CONOCIMIENTO DEL MENÚ:
          Tienes acceso a la carta real del restaurante:
          ${menuContext}
          
          REGLAS DE RESPUESTA:
          1. Usa un tono profesional, amable y servicial, como un anfitrión de alta gama.
          2. Responde SIEMPRE en formato Markdown atractivo.
          3. Usa negritas (**), cursivas (*), listas y tablas cuando sea apropiado.
          4. Si te piden una tabla de platos, genérala en Markdown.
          5. Sé preciso con los precios y descripciones de los platos.
          6. No inventes platos que no estén en la lista proporcionada.
          7. Si no sabes algo, admítelo con elegancia.
          8. Usa emojis relacionados con la cultura china y peruana (🐉, 🥟, 🍚, 🇵🇪, 🇨🇳).
          9. NO menciones términos del "Diccionario" a menos que el usuario los use primero (mantén el foco en el menú y atención).`,
        }
      });
    }
  }, [menuData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const systemInstruction = `Eres Marley, un asistente experto en cocina Chifa (fusión peruano-china) y específicamente del restaurante "Chifa Brillo El Sol". 
          
          CONOCIMIENTO DEL MENÚ:
          Tienes acceso a la carta real del restaurante:
          ${menuData.map(item => `- ${item.name} (${item.category}${item.subCategory ? ` - ${item.subCategory}` : ''}): ${item.description}. Precio: S/ ${item.price}. ${item.flavor ? `Sabor: ${item.flavor}` : ''}`).join('\n')}
          
          REGLAS DE RESPUESTA:
          1. Usa un tono profesional, amable y servicial, como un anfitrión de alta gama.
          2. Responde SIEMPRE en formato Markdown atractivo.
          3. Usa negritas (**), cursivas (*), listas y tablas cuando sea apropiado.
          4. Si te piden una tabla de platos, genérala en Markdown.
          5. Sé preciso con los precios y descripciones de los platos.
          6. No inventes platos que no estén en la lista proporcionada.
          7. Si no sabes algo, admítelo con elegancia.
          8. Usa emojis relacionados con la cultura china y peruana (🐉, 🥟, 🍚, 🇵🇪, 🇨🇳).
          9. NO menciones términos del "Diccionario" a menos que el usuario los use primero (mantén el foco en el menú y atención).`;

    try {
      // Primary: Gemini
      if (!chatRef.current) {
        chatRef.current = ai.chats.create({
          model: 'gemini-3.1-flash-lite-preview',
          config: { systemInstruction }
        });
      }

      const response = await chatRef.current.sendMessage({ message: userMessage.text });
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: response.text || 'Lo siento, no pude procesar tu solicitud.'
      }]);
    } catch (error) {
      console.warn('Gemini failed, trying fallback...', error);
      
      // Fallback 1: OpenRouter (Nemotron)
      try {
        const openRouterKey = (import.meta as any).env.VITE_OPENROUTER_API_KEY;
        if (!openRouterKey) throw new Error('OpenRouter key missing');

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Chifa Brillo El Sol"
          },
          body: JSON.stringify({
            "model": "nvidia/nemotron-3-super-120b-a12b:free",
            "messages": [
              { "role": "system", "content": systemInstruction },
              ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
              { "role": "user", "content": userMessage.text }
            ]
          })
        });

        if (!response.ok) {
          // Try second fallback: Gemini 2.0 Flash via OpenRouter
          const response2 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": window.location.origin,
              "X-Title": "Chifa Brillo El Sol"
            },
            body: JSON.stringify({
              "model": "google/gemini-2.0-flash-exp:free",
              "messages": [
                { "role": "system", "content": systemInstruction },
                ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
                { "role": "user", "content": userMessage.text }
              ]
            })
          });

          if (!response2.ok) throw new Error('All OpenRouter fallbacks failed');
          const data2 = await response2.json();
          const text2 = data2.choices[0].message.content;

          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: text2 || 'Lo siento, no pude procesar tu solicitud.'
          }]);
          return;
        }

        const data = await response.json();
        const text = data.choices[0].message.content;

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: text || 'Lo siento, no pude procesar tu solicitud.'
        }]);
      } catch (fallbackError) {
        console.error('All AI systems failed:', fallbackError);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: 'Hubo un error crítico en todos los sistemas de IA. Por favor, intenta de nuevo más tarde.'
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper className="h-[calc(100vh-11rem)] md:h-[calc(100vh-13rem)] flex flex-col -mx-4 -mt-4 md:-mx-6 md:-mt-6 lg:-mx-8 lg:-mt-8">
      <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 bg-white/5 dark:bg-black/20 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center">
          <Bot className="w-6 h-6 mr-2 text-gold-champagne shrink-0" />
          <div>
            <h1 className="font-heading text-sm md:text-base font-bold leading-none">
              MARLEY <span className="gold-text">IA</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
              Experta • Online
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-dragon-red ml-2 md:ml-4' : 'bg-gold-champagne/20 border border-gold-champagne mr-2 md:mr-4'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <Bot className="w-4 h-4 md:w-5 md:h-5 text-gold-champagne" />}
                </div>
                <div className={`p-3 md:p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-dragon-red/10 border border-dragon-red/20 text-silk-white-light dark:text-silk-white-dark' 
                    : 'bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/10'
                }`}>
                  <div className="markdown-body overflow-x-auto text-sm md:text-base">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex flex-row max-w-[80%]">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 bg-gold-champagne/20 border border-gold-champagne mr-2 md:mr-4">
                  <Bot className="w-4 h-4 md:w-5 md:h-5 text-gold-champagne" />
                </div>
                <div className="p-3 md:p-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div className="flex space-x-2">
                    <div className="w-1.5 h-1.5 bg-gold-champagne rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gold-champagne rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-gold-champagne rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 md:p-4 border-t border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-xl">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex space-x-2 md:space-x-4"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="flex-1 bg-white/50 dark:bg-black/30 border-black/10 dark:border-white/10"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="px-4 md:px-8">
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
