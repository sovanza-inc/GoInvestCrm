// Global Color Configuration for GoSocial
// All colors are theme-aware and switch automatically with dark/light mode

export const colors = {
  // Status Colors
  status: {
    new: "bg-slate-500/20 text-slate-400 border-slate-600/30",
    contacted: "bg-blue-500/20 text-blue-400 border-blue-600/30",
    qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-600/30",
    negotiation: "bg-amber-500/20 text-amber-400 border-amber-600/30",
    closed: "bg-green-500/20 text-green-400 border-green-600/30",
    lost: "bg-red-500/20 text-red-400 border-red-600/30",
  },

  // Score Colors (for lead scoring)
  score: {
    hot: "text-emerald-400",     // 70+
    warm: "text-amber-400",       // 40-69
    cold: "text-blue-400",        // <40
  },

  // Platform Colors
  platform: {
    instagram: "text-pink-400 border-pink-500/30 bg-pink-500/10",
    facebook: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    linkedin: "text-sky-400 border-sky-500/30 bg-sky-500/10",
    twitter: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    whatsapp: "text-green-400 border-green-500/30 bg-green-500/10",
  },

  // Role Colors
  role: {
    admin: "bg-red-600/20 text-red-400 border-red-700",
    manager: "bg-blue-600/20 text-blue-400 border-blue-700",
    agent: "bg-green-600/20 text-green-400 border-green-700",
  },

  // UI Element Colors
  ui: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
    warning: "bg-amber-600 text-white hover:bg-amber-500",
    danger: "bg-red-600 text-white hover:bg-red-500",
    info: "bg-blue-600 text-white hover:bg-blue-500",
  },

  // Card & Surface Colors
  surface: {
    card: "bg-card border-border",
    elevated: "bg-card/50 backdrop-blur-sm border-border",
    hover: "hover:bg-accent transition-colors",
  },

  // Text Colors
  text: {
    primary: "text-foreground",
    secondary: "text-muted-foreground",
    tertiary: "text-muted-foreground/60",
    success: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-red-400",
    info: "text-blue-400",
  },

  // Gradient Backgrounds (for CTAs, special elements)
  gradient: {
    primary: "bg-gradient-to-r from-violet-600 to-blue-600",
    success: "bg-gradient-to-r from-emerald-500 to-teal-600",
    warning: "bg-gradient-to-r from-amber-500 to-orange-600",
    vibrant: "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600",
  },
};

// Helper function to get color classes
export const getStatusColor = (status) => colors.status[status] || colors.status.new;
export const getScoreColor = (score) => {
  if (score >= 70) return colors.score.hot;
  if (score >= 40) return colors.score.warm;
  return colors.score.cold;
};
export const getScoreLabel = (score) => {
  if (score >= 70) return "Hot";
  if (score >= 40) return "Warm";
  return "Cold";
};
export const getPlatformColor = (platform) => colors.platform[platform?.toLowerCase()] || colors.platform.instagram;
export const getRoleColor = (role) => colors.role[role?.toLowerCase()] || colors.role.agent;
