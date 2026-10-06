"use client"

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ar from '@/public/src/locales/ar.json';
import de from '@/public/src/locales/de.json';
import en from '@/public/src/locales/en.json';
import es from '@/public/src/locales/es.json';
import fr from '@/public/src/locales/fr.json';
import hu from '@/public/src/locales/hu.json';
import it from '@/public/src/locales/it.json';
import ja from '@/public/src/locales/ja.json';
import zh from '@/public/src/locales/zh.json';

const resources = {
  ar: { translation: ar },
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  hu: { translation: hu },
  it: { translation: it },
  ja: { translation: ja },
  zh: { translation: zh },
};
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false } // Helps prevent loading issues in some Next.js setups
  });

export default i18n;

// const resources = {
//   en: {
//     translation: {
//       // --- NAVIGATION ---
//       nav_home: "Home Feed",
//       nav_messages: "Messages",
//       nav_shorts: "Shorts",
//       nav_groups: "Groups",
//       nav_live: "Live",
//       nav_events: "Events",
//       nav_mall: "Global Mall",
//       nav_suite: "Suite Hub",
//       nav_tv: "TV Network",
//       nav_settings: "Settings",
//       nav_preferences: "Preferences",
//       nav_logout: "Log Out",
//       search_placeholder: "Search products, people, events...",

//       // --- CREATE POST ---
//       cp_placeholder: "What's golden today?",
//       cp_photo: "Photo",
//       cp_video: "Video",
//       cp_post: "Post",
//       cp_uploading: "Posting...",

//       // --- WIDGETS ---
//       widget_requests: "Requests",
//       widget_new: "New",
//       widget_no_requests: "No pending requests.",
//       widget_people: "People You May Know",
//       widget_trending: "Trending Topics",
//       widget_chat_product: "Product Msgs",
//       widget_chat_friends: "My Friends",
      
//       // --- ACTIONS ---
//       btn_accept: "Accept",
//       btn_reject: "Reject",
//       btn_add: "Add",
//       btn_sent: "Sent",
      
//       // --- POST FEED ---
//       post_like: "Like",
//       post_comment: "Comment",
//       post_share: "Share",
      
//       // --- SETTINGS HEADERS ---
//       set_visibility: "My Visibility",
//       set_language: "Language",
//       set_notifications: "Notifications",
//       set_permissions: "Permissions",
//       set_media: "Media Preferences",
//       set_revenue: "Manage Revenue",
//       set_history: "Purchase History",
//       set_cards: "Payment Methods",
//       set_privacy: "Privacy",
//       set_licenses: "Licenses",
//       set_blocked: "Blocked Users"
//     }
//   },
//   es: { // Example Spanish
//     translation: {
//       nav_home: "Inicio",
//       nav_messages: "Mensajes",
//       nav_shorts: "Cortos",
//       nav_groups: "Comunidades",
//       nav_live: "En Vivo",
//       nav_events: "Eventos",
//       nav_mall: "Mercado",
//       nav_suite: "Suite Hub",
//       nav_tv: "Red TV",
//       nav_settings: "Ajustes",
//       nav_preferences: "Preferencias",
//       nav_logout: "Cerrar Sesión",
//       search_placeholder: "Buscar productos...",
//       cp_placeholder: "¿Qué hay de nuevo?",
//       cp_photo: "Foto",
//       cp_video: "Video",
//       cp_post: "Publicar",
//       widget_requests: "Solicitudes",
//       widget_people: "Sugerencias",
//       widget_trending: "Tendencias",
//       btn_add: "Añadir",
//       btn_sent: "Enviado",
//       set_language: "Idioma"
//     }
//   },
//   zh: { // Example Chinese
//     translation: {
//       nav_home: "首页",
//       nav_messages: "消息",
//       nav_shorts: "短视频",
//       nav_groups: "社区",
//       nav_live: "直播",
//       nav_events: "活动",
//       nav_mall: "市场",
//       nav_suite: "套件中心",
//       nav_tv: "电视网络",
//       nav_settings: "设置",
//       nav_preferences: "偏好",
//       nav_logout: "登出",
//       search_placeholder: "搜索...",
//       cp_placeholder: "今天有什么新鲜事？",
//       cp_photo: "照片",
//       cp_video: "视频",
//       cp_post: "发布",
//       widget_requests: "好友请求",
//       widget_people: "您可能认识的人",
//       widget_trending: "热门话题",
//       btn_add: "添加",
//       btn_sent: "已发送",
//       set_language: "语言"
//     }
//   },
//   ar: {
//     translation: {
//       nav_home: "الصفحة الرئيسية",
//       nav_messages: "الرسائل",
//       nav_shorts: "المقاطع القصيرة",
//       nav_groups: "المجتمعات",
//       nav_live: "مباشر",
//       nav_events: "الفعاليات",
//       nav_mall: "المتجر",
//       nav_suite: "مركز الأدوات",
//       nav_tv: "شبكة التلفاز",
//       nav_settings: "الإعدادات",
//       nav_preferences: "التفضيلات",
//       nav_logout: "تسجيل الخروج",
//       search_placeholder: "ابحث عن منتجات أو أشخاص...",
//       cp_placeholder: "ما الجديد اليوم؟",
//       cp_photo: "صورة",
//       cp_video: "فيديو",
//       cp_post: "نشر",
//       widget_requests: "الطلبات",
//       widget_people: "أشخاص قد تعرفهم",
//       widget_trending: "المواضيع الشائعة",
//       btn_add: "إضافة",
//       btn_sent: "تم الإرسال",
//       set_language: "اللغة"
//     }
//   },

//   pt: {
//     translation: {
//       nav_home: "Início",
//       nav_messages: "Mensagens",
//       nav_shorts: "Curtos",
//       nav_groups: "Comunidades",
//       nav_live: "Ao Vivo",
//       nav_events: "Eventos",
//       nav_mall: "Mercado",
//       nav_suite: "Central",
//       nav_tv: "Rede TV",
//       nav_settings: "Configurações",
//       nav_preferences: "Preferências",
//       nav_logout: "Sair",
//       search_placeholder: "Pesquisar produtos...",
//       cp_placeholder: "O que há de novo?",
//       cp_photo: "Foto",
//       cp_video: "Vídeo",
//       cp_post: "Publicar",
//       widget_requests: "Solicitações",
//       widget_people: "Pessoas sugeridas",
//       widget_trending: "Tópicos em alta",
//       btn_add: "Adicionar",
//       btn_sent: "Enviado",
//       set_language: "Idioma"
//     }
//   },

//   fr: {
//     translation: {
//       nav_home: "Accueil",
//       nav_messages: "Messages",
//       nav_shorts: "Vidéos courtes",
//       nav_groups: "Communautés",
//       nav_live: "En direct",
//       nav_events: "Événements",
//       nav_mall: "Marché",
//       nav_suite: "Centre",
//       nav_tv: "Réseau TV",
//       nav_settings: "Paramètres",
//       nav_preferences: "Préférences",
//       nav_logout: "Déconnexion",
//       search_placeholder: "Rechercher...",
//       cp_placeholder: "Quoi de neuf ?",
//       cp_photo: "Photo",
//       cp_video: "Vidéo",
//       cp_post: "Publier",
//       widget_requests: "Demandes",
//       widget_people: "Suggestions",
//       widget_trending: "Tendances",
//       btn_add: "Ajouter",
//       btn_sent: "Envoyé",
//       set_language: "Langue"
//     }
//   },

//   de: {
//     translation: {
//       nav_home: "Startseite",
//       nav_messages: "Nachrichten",
//       nav_shorts: "Kurzvideos",
//       nav_groups: "Gemeinschaften",
//       nav_live: "Live",
//       nav_events: "Veranstaltungen",
//       nav_mall: "Marktplatz",
//       nav_suite: "Suite Hub",
//       nav_tv: "TV-Netzwerk",
//       nav_settings: "Einstellungen",
//       nav_preferences: "Voreinstellungen",
//       nav_logout: "Abmelden",
//       search_placeholder: "Suchen...",
//       cp_placeholder: "Was gibt’s Neues?",
//       cp_photo: "Foto",
//       cp_video: "Video",
//       cp_post: "Posten",
//       widget_requests: "Anfragen",
//       widget_people: "Vorschläge",
//       widget_trending: "Trends",
//       btn_add: "Hinzufügen",
//       btn_sent: "Gesendet",
//       set_language: "Sprache"
//     }
//   },

//   hi: {
//     translation: {
//       nav_home: "होम",
//       nav_messages: "संदेश",
//       nav_shorts: "शॉर्ट्स",
//       nav_groups: "समुदाय",
//       nav_live: "लाइव",
//       nav_events: "कार्यक्रम",
//       nav_mall: "मार्केट",
//       nav_suite: "सुइट हब",
//       nav_tv: "टीवी नेटवर्क",
//       nav_settings: "सेटिंग्स",
//       nav_preferences: "पसंद",
//       nav_logout: "लॉग आउट",
//       search_placeholder: "खोजें...",
//       cp_placeholder: "आज क्या नया है?",
//       cp_photo: "फोटो",
//       cp_video: "वीडियो",
//       cp_post: "पोस्ट करें",
//       widget_requests: "अनुरोध",
//       widget_people: "सुझाव",
//       widget_trending: "ट्रेंडिंग",
//       btn_add: "जोड़ें",
//       btn_sent: "भेजा गया",
//       set_language: "भाषा"
//     }
//   },

//   ja: {
//     translation: {
//       nav_home: "ホーム",
//       nav_messages: "メッセージ",
//       nav_shorts: "ショート",
//       nav_groups: "コミュニティ",
//       nav_live: "ライブ",
//       nav_events: "イベント",
//       nav_mall: "マーケット",
//       nav_suite: "スイート",
//       nav_tv: "テレビネットワーク",
//       nav_settings: "設定",
//       nav_preferences: "環境設定",
//       nav_logout: "ログアウト",
//       search_placeholder: "検索...",
//       cp_placeholder: "今どうしてる？",
//       cp_photo: "写真",
//       cp_video: "動画",
//       cp_post: "投稿",
//       widget_requests: "リクエスト",
//       widget_people: "おすすめ",
//       widget_trending: "トレンド",
//       btn_add: "追加",
//       btn_sent: "送信済み",
//       set_language: "言語"
//     }
//   },

//   ru: {
//     translation: {
//       nav_home: "Главная",
//       nav_messages: "Сообщения",
//       nav_shorts: "Короткие видео",
//       nav_groups: "Сообщества",
//       nav_live: "Прямой эфир",
//       nav_events: "События",
//       nav_mall: "Маркет",
//       nav_suite: "Центр",
//       nav_tv: "ТВ сеть",
//       nav_settings: "Настройки",
//       nav_preferences: "Предпочтения",
//       nav_logout: "Выйти",
//       search_placeholder: "Поиск...",
//       cp_placeholder: "Что нового?",
//       cp_photo: "Фото",
//       cp_video: "Видео",
//       cp_post: "Опубликовать",
//       widget_requests: "Запросы",
//       widget_people: "Рекомендации",
//       widget_trending: "В тренде",
//       btn_add: "Добавить",
//       btn_sent: "Отправлено",
//       set_language: "Язык"
//     }
//   },
//   ko: {
//     translation: {
//       nav_home: "홈",
//       nav_messages: "메시지",
//       nav_shorts: "쇼츠",
//       nav_groups: "커뮤니티",
//       nav_live: "라이브",
//       nav_events: "이벤트",
//       nav_mall: "마켓",
//       nav_suite: "스위트 허브",
//       nav_tv: "TV 네트워크",
//       nav_settings: "설정",
//       nav_preferences: "환경설정",
//       nav_logout: "로그아웃",
//       search_placeholder: "검색...",
//       cp_placeholder: "무슨 생각을 하고 있나요?",
//       cp_photo: "사진",
//       cp_video: "동영상",
//       cp_post: "게시",
//       widget_requests: "요청",
//       widget_people: "추천 사용자",
//       widget_trending: "트렌드",
//       btn_add: "추가",
//       btn_sent: "전송됨",
//       set_language: "언어"
//     }
//   },

//   tr: {
//     translation: {
//       nav_home: "Ana Sayfa",
//       nav_messages: "Mesajlar",
//       nav_shorts: "Kısa Videolar",
//       nav_groups: "Topluluklar",
//       nav_live: "Canlı",
//       nav_events: "Etkinlikler",
//       nav_mall: "Pazar",
//       nav_suite: "Merkez",
//       nav_tv: "TV Ağı",
//       nav_settings: "Ayarlar",
//       nav_preferences: "Tercihler",
//       nav_logout: "Çıkış Yap",
//       search_placeholder: "Ara...",
//       cp_placeholder: "Ne düşünüyorsun?",
//       cp_photo: "Fotoğraf",
//       cp_video: "Video",
//       cp_post: "Paylaş",
//       widget_requests: "İstekler",
//       widget_people: "Önerilenler",
//       widget_trending: "Trendler",
//       btn_add: "Ekle",
//       btn_sent: "Gönderildi",
//       set_language: "Dil"
//     }
//   },

//   ur: {
//     translation: {
//       nav_home: "ہوم",
//       nav_messages: "پیغامات",
//       nav_shorts: "شارٹس",
//       nav_groups: "کمیونٹیز",
//       nav_live: "لائیو",
//       nav_events: "ایونٹس",
//       nav_mall: "مارکیٹ",
//       nav_suite: "سویٹ حب",
//       nav_tv: "ٹی وی نیٹ ورک",
//       nav_settings: "سیٹنگز",
//       nav_preferences: "ترجیحات",
//       nav_logout: "لاگ آؤٹ",
//       search_placeholder: "تلاش کریں...",
//       cp_placeholder: "آج کیا نیا ہے؟",
//       cp_photo: "تصویر",
//       cp_video: "ویڈیو",
//       cp_post: "پوسٹ کریں",
//       widget_requests: "درخواستیں",
//       widget_people: "ممکنہ جاننے والے",
//       widget_trending: "ٹرینڈنگ",
//       btn_add: "شامل کریں",
//       btn_sent: "بھیج دیا گیا",
//       set_language: "زبان"
//     }
//   },

//   bn: {
//     translation: {
//       nav_home: "হোম",
//       nav_messages: "বার্তা",
//       nav_shorts: "শর্টস",
//       nav_groups: "কমিউনিটি",
//       nav_live: "লাইভ",
//       nav_events: "ইভেন্ট",
//       nav_mall: "মার্কেট",
//       nav_suite: "সুইট হাব",
//       nav_tv: "টিভি নেটওয়ার্ক",
//       nav_settings: "সেটিংস",
//       nav_preferences: "পছন্দসমূহ",
//       nav_logout: "লগ আউট",
//       search_placeholder: "অনুসন্ধান...",
//       cp_placeholder: "আজ নতুন কী?",
//       cp_photo: "ছবি",
//       cp_video: "ভিডিও",
//       cp_post: "পোস্ট",
//       widget_requests: "অনুরোধ",
//       widget_people: "প্রস্তাবিত",
//       widget_trending: "ট্রেন্ডিং",
//       btn_add: "যোগ করুন",
//       btn_sent: "পাঠানো হয়েছে",
//       set_language: "ভাষা"
//     }
//   },

//   nl: {
//     translation: {
//       nav_home: "Start",
//       nav_messages: "Berichten",
//       nav_shorts: "Korte video's",
//       nav_groups: "Gemeenschappen",
//       nav_live: "Live",
//       nav_events: "Evenementen",
//       nav_mall: "Marktplaats",
//       nav_suite: "Suite Hub",
//       nav_tv: "TV Netwerk",
//       nav_settings: "Instellingen",
//       nav_preferences: "Voorkeuren",
//       nav_logout: "Uitloggen",
//       search_placeholder: "Zoeken...",
//       cp_placeholder: "Wat is er nieuw?",
//       cp_photo: "Foto",
//       cp_video: "Video",
//       cp_post: "Plaatsen",
//       widget_requests: "Verzoeken",
//       widget_people: "Suggesties",
//       widget_trending: "Trending",
//       btn_add: "Toevoegen",
//       btn_sent: "Verzonden",
//       set_language: "Taal"
//     }
//   },

//   sv: {
//     translation: {
//       nav_home: "Hem",
//       nav_messages: "Meddelanden",
//       nav_shorts: "Korta videor",
//       nav_groups: "Gemenskaper",
//       nav_live: "Live",
//       nav_events: "Evenemang",
//       nav_mall: "Marknad",
//       nav_suite: "Nav",
//       nav_tv: "TV-nätverk",
//       nav_settings: "Inställningar",
//       nav_preferences: "Preferenser",
//       nav_logout: "Logga ut",
//       search_placeholder: "Sök...",
//       cp_placeholder: "Vad händer?",
//       cp_photo: "Foto",
//       cp_video: "Video",
//       cp_post: "Publicera",
//       widget_requests: "Förfrågningar",
//       widget_people: "Förslag",
//       widget_trending: "Trender",
//       btn_add: "Lägg till",
//       btn_sent: "Skickat",
//       set_language: "Språk"
//     }
//   },

//   th: {
//     translation: {
//       nav_home: "หน้าแรก",
//       nav_messages: "ข้อความ",
//       nav_shorts: "วิดีโอสั้น",
//       nav_groups: "ชุมชน",
//       nav_live: "ถ่ายทอดสด",
//       nav_events: "กิจกรรม",
//       nav_mall: "ตลาด",
//       nav_suite: "ศูนย์รวม",
//       nav_tv: "เครือข่ายทีวี",
//       nav_settings: "การตั้งค่า",
//       nav_preferences: "การตั้งค่า",
//       nav_logout: "ออกจากระบบ",
//       search_placeholder: "ค้นหา...",
//       cp_placeholder: "วันนี้เป็นอย่างไร?",
//       cp_photo: "รูปภาพ",
//       cp_video: "วิดีโอ",
//       cp_post: "โพสต์",
//       widget_requests: "คำขอ",
//       widget_people: "แนะนำ",
//       widget_trending: "กำลังมาแรง",
//       btn_add: "เพิ่ม",
//       btn_sent: "ส่งแล้ว",
//       set_language: "ภาษา"
//     }
//   },

//   vi: {
//     translation: {
//       nav_home: "Trang chủ",
//       nav_messages: "Tin nhắn",
//       nav_shorts: "Video ngắn",
//       nav_groups: "Cộng đồng",
//       nav_live: "Trực tiếp",
//       nav_events: "Sự kiện",
//       nav_mall: "Chợ",
//       nav_suite: "Trung tâm",
//       nav_tv: "Mạng TV",
//       nav_settings: "Cài đặt",
//       nav_preferences: "Tùy chọn",
//       nav_logout: "Đăng xuất",
//       search_placeholder: "Tìm kiếm...",
//       cp_placeholder: "Có gì mới?",
//       cp_photo: "Ảnh",
//       cp_video: "Video",
//       cp_post: "Đăng",
//       widget_requests: "Yêu cầu",
//       widget_people: "Gợi ý",
//       widget_trending: "Xu hướng",
//       btn_add: "Thêm",
//       btn_sent: "Đã gửi",
//       set_language: "Ngôn ngữ"
//     }
//   }
  
// };

// i18n
//   .use(LanguageDetector)
//   .use(initReactI18next)
//   .init({
//     resources,
//     fallbackLng: 'en',
//     interpolation: { escapeValue: false }
//   });

// export default i18n;