import type { IconType } from "react-icons/lib";
import {
  SiNetflix, SiSpotify, SiAmazon, SiAppletv, SiYoutube,
  SiHbo, SiTwitch,
  SiApplemusic, SiTidal, SiSoundcloud,
  SiPlaystation, SiSteam, SiNintendo, SiEpicgames,
  SiNotion, SiSlack, SiFigma, SiGithub, SiDropbox,
  SiGoogledrive, SiEvernote, SiTodoist,
  SiAdobe, SiCanva, SiZoom,
  SiGooglecloud, SiAmazonwebservices, SiDigitalocean, SiCloudflare,
  SiUbereats, SiDoordash, SiGrubhub,
  SiDuolingo, SiLinkedin, SiMedium,
  SiNordvpn, SiProtonmail, SiBitdefender,
  SiCrunchyroll, SiPatreon, SiStrava,
  SiApple,
} from "react-icons/si";

export interface ServiceIconConfig {
  icon: IconType;
  color: string;
  keywords: string[];
}

export const serviceIconMap: Record<string, ServiceIconConfig> = {
  netflix: {
    icon: SiNetflix,
    color: "#E50914",
    keywords: ["netflix"],
  },
  spotify: {
    icon: SiSpotify,
    color: "#1DB954",
    keywords: ["spotify"],
  },
  amazon_prime: {
    icon: SiAmazon,
    color: "#FF9900",
    keywords: ["amazon", "prime", "prime video", "amazon prime"],
  },
  apple_tv: {
    icon: SiAppletv,
    color: "#000000",
    keywords: ["apple tv", "apple tv+", "appletv"],
  },
  youtube: {
    icon: SiYoutube,
    color: "#FF0000",
    keywords: ["youtube", "youtube premium", "youtube music", "youtube tv"],
  },
  disney_plus: {
    icon: SiApple,
    color: "#113CCF",
    keywords: ["disney", "disney+", "disneyplus", "disney plus"],
  },
  hbo: {
    icon: SiHbo,
    color: "#5822B4",
    keywords: ["hbo", "hbo max", "max"],
  },
  twitch: {
    icon: SiTwitch,
    color: "#9146FF",
    keywords: ["twitch"],
  },
  apple_music: {
    icon: SiApplemusic,
    color: "#FC3C44",
    keywords: ["apple music"],
  },
  tidal: {
    icon: SiTidal,
    color: "#000000",
    keywords: ["tidal"],
  },
  soundcloud: {
    icon: SiSoundcloud,
    color: "#FF5500",
    keywords: ["soundcloud"],
  },
  playstation: {
    icon: SiPlaystation,
    color: "#003791",
    keywords: ["playstation", "ps plus", "ps now", "ps+", "psn"],
  },
  steam: {
    icon: SiSteam,
    color: "#1B2838",
    keywords: ["steam"],
  },
  nintendo: {
    icon: SiNintendo,
    color: "#E60012",
    keywords: ["nintendo", "nintendo switch", "switch online"],
  },
  epic_games: {
    icon: SiEpicgames,
    color: "#313131",
    keywords: ["epic", "epic games"],
  },
  notion: {
    icon: SiNotion,
    color: "#000000",
    keywords: ["notion"],
  },
  slack: {
    icon: SiSlack,
    color: "#4A154B",
    keywords: ["slack"],
  },
  figma: {
    icon: SiFigma,
    color: "#F24E1E",
    keywords: ["figma"],
  },
  github: {
    icon: SiGithub,
    color: "#181717",
    keywords: ["github", "github copilot"],
  },
  dropbox: {
    icon: SiDropbox,
    color: "#0061FF",
    keywords: ["dropbox"],
  },
  google_drive: {
    icon: SiGoogledrive,
    color: "#4285F4",
    keywords: ["google drive", "google one", "google storage"],
  },
  evernote: {
    icon: SiEvernote,
    color: "#00A82D",
    keywords: ["evernote"],
  },
  todoist: {
    icon: SiTodoist,
    color: "#E44332",
    keywords: ["todoist"],
  },
  adobe: {
    icon: SiAdobe,
    color: "#FF0000",
    keywords: ["adobe", "creative cloud", "photoshop", "illustrator", "premiere", "lightroom"],
  },
  canva: {
    icon: SiCanva,
    color: "#00C4CC",
    keywords: ["canva"],
  },
  zoom: {
    icon: SiZoom,
    color: "#2D8CFF",
    keywords: ["zoom"],
  },
  google_cloud: {
    icon: SiGooglecloud,
    color: "#4285F4",
    keywords: ["google cloud", "gcp"],
  },
  aws: {
    icon: SiAmazonwebservices,
    color: "#FF9900",
    keywords: ["aws", "amazon web services"],
  },
  digitalocean: {
    icon: SiDigitalocean,
    color: "#0080FF",
    keywords: ["digitalocean", "digital ocean"],
  },
  cloudflare: {
    icon: SiCloudflare,
    color: "#F38020",
    keywords: ["cloudflare"],
  },
  uber_eats: {
    icon: SiUbereats,
    color: "#06C167",
    keywords: ["uber eats", "ubereats"],
  },
  doordash: {
    icon: SiDoordash,
    color: "#FF3008",
    keywords: ["doordash", "door dash"],
  },
  grubhub: {
    icon: SiGrubhub,
    color: "#F63440",
    keywords: ["grubhub"],
  },
  duolingo: {
    icon: SiDuolingo,
    color: "#58CC02",
    keywords: ["duolingo"],
  },
  linkedin: {
    icon: SiLinkedin,
    color: "#0A66C2",
    keywords: ["linkedin", "linkedin premium"],
  },
  medium: {
    icon: SiMedium,
    color: "#000000",
    keywords: ["medium"],
  },
  nordvpn: {
    icon: SiNordvpn,
    color: "#4687FF",
    keywords: ["nordvpn", "nord vpn"],
  },
  protonmail: {
    icon: SiProtonmail,
    color: "#6D4AFF",
    keywords: ["proton", "protonmail", "proton mail", "proton vpn"],
  },
  bitdefender: {
    icon: SiBitdefender,
    color: "#ED1C24",
    keywords: ["bitdefender"],
  },
  crunchyroll: {
    icon: SiCrunchyroll,
    color: "#F47521",
    keywords: ["crunchyroll"],
  },
  patreon: {
    icon: SiPatreon,
    color: "#FF424D",
    keywords: ["patreon"],
  },
  strava: {
    icon: SiStrava,
    color: "#FC4C02",
    keywords: ["strava"],
  },
};

export function matchServiceIcon(name: string): ServiceIconConfig | null {
  const normalized = name.toLowerCase().trim();

  for (const config of Object.values(serviceIconMap)) {
    for (const keyword of config.keywords) {
      if (normalized === keyword) {
        return config;
      }
    }
  }

  for (const config of Object.values(serviceIconMap)) {
    for (const keyword of config.keywords) {
      if (normalized.includes(keyword) || keyword.includes(normalized)) {
        return config;
      }
    }
  }

  const words = normalized.replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  for (const config of Object.values(serviceIconMap)) {
    for (const keyword of config.keywords) {
      const keywordWords = keyword.split(/\s+/);
      for (const word of words) {
        if (word.length >= 3) {
          for (const kw of keywordWords) {
            if (kw.startsWith(word) || word.startsWith(kw)) {
              return config;
            }
          }
        }
      }
    }
  }

  return null;
}

