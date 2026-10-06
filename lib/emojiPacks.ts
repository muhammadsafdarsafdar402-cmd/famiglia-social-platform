// src/lib/EmojiData.ts

export type EmojiItem = {
    icon: string;       // This will now be the FILE PATH (e.g., '/icons/custom/smile.png')
    name: string;
    meaning: string;
    isCustomImage: boolean; // Set to true for your images
};

export type EmojiPack = {
    id: string;
    name: string;
    description: string;
    level: 1 | 2;       // 1 = Free, 2 = VIP
    emojis: EmojiItem[];
};

export const EMOJI_PACKS: Record<string, EmojiPack> = {
    // --- LEVEL 1: FREE / BASIC CUSTOM PACK ---
    defaults: {
        id: 'defaults',
        name: 'Starter Pack',
        description: 'Basic custom reactions available to everyone.',
        level: 2, 
        emojis: [
            { 
                icon: '/icons/emojis/blocked.png', 
                name: 'Thumbs Up', 
                meaning: 'Approval', 
                isCustomImage: true 
            },
            { 
                icon: '/icons/emojis/boring.png', 
                name: 'Heart', 
                meaning: 'Love', 
                isCustomImage: true 
            },
            { 
                icon: '/icons/emojis/cap.png', 
                name: 'Laugh', 
                meaning: 'Joy', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/bull_shit.png', 
                name: 'Laugh', 
                meaning: 'Joy', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/business_lifetime.png', 
                name: 'Laugh', 
                meaning: 'Joy', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/challenge.png', 
                name: 'Laugh', 
                meaning: 'Joy', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/congrats.png', 
                name: 'Laugh', 
                meaning: 'Joy', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/cool.png', 
                name: 'Laugh', 
                meaning: 'Joy', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/digital_panhandler.png', 
                name: 'Laugh', 
                meaning: 'Joy', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/dork.png', 
                name: 'Laugh', 
                meaning: 'Joy', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/dumb_ass.png', 
                name: 'Laugh', 
                meaning: 'Joy', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/fake_news.png', 
                name: 'Laugh', 
                meaning: 'Joy', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/dork.png', 
                name: 'dork', 
                meaning: 'dork', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/good_job.png', 
                name: 'GoodJob', 
                meaning: 'GoodJob', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/goofy.png', 
                name: 'GoodJob', 
                meaning: 'GoodJob', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/graduate.png', 
                name: 'GoodJob', 
                meaning: 'GoodJob', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/great_idea.png', 
                name: 'GoodJob', 
                meaning: 'GoodJob', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/hbd.png', 
                name: 'GoodJob', 
                meaning: 'GoodJob', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/hi_beautiful.png', 
                name: 'GoodJob', 
                meaning: 'GoodJob', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/hit_it.png', 
                name: 'GoodJob', 
                meaning: 'GoodJob', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/hugs.png', 
                name: 'GoodJob', 
                meaning: 'GoodJob', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/i_challange_you.png', 
                name: 'GoodJob', 
                meaning: 'GoodJob', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/idk_nothing.png', 
                name: 'GoodJob', 
                meaning: 'GoodJob', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/praying.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/sorry.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/stand_on_business.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/stop_complaining.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/stop_snitching.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/stop.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/stopdry.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
        ]
    },

    // --- LEVEL 2: VIP / EXCLUSIVE PACK ---
    vip_famiglia: {
        id: 'vip_famiglia',
        name: 'Don Status',
        description: 'Exclusive Famiglia symbols. Only for VIPs.',
        level: 2,
        emojis: [
            { 
                icon: '/icons/emojis/investor_badge.png', 
                name: 'The Lion', 
                meaning: 'Supreme Leadership', 
                isCustomImage: true 
            },
            { 
                icon: '/icons/emojis/its_litt.png', 
                name: 'Crown', 
                meaning: 'The Boss', 
                isCustomImage: true 
            },
            { 
                icon: '/icons/emojis/jh4c.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/kisses.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/let_go.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/liar.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/lol.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/looks_good.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/loser.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/not_today.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/noted.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/panhandler.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/period.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/picture_perfect.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/praying.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/preach.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/quote_on_quote.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/rat.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/sad.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/salute.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/save_it.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/scammer.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/scammer1.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/scary.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/show_time.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
             { 
                icon: '/icons/emojis/sick_of_you.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },

             { 
                icon: '/icons/emojis/thumbs_down.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/toxic.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/trash.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/trolling.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/trolling1.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/wow.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/wth.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/yeah_sure.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            }, { 
                icon: '/icons/emojis/ygktfo.png', 
                name: 'Bag', 
                meaning: 'Secured the bag', 
                isCustomImage: true 
            },
        ]
    }
};