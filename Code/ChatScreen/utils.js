export const generateShortDisplayName = (name) => {
    if (!name || typeof name !== 'string' || !name.trim()) return 'AN';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };
  
  export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  export const getColorForName = (name, userColors) => {
    if (!userColors[name]) {
      const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colors = [
        '#FF5733', '#33A1FD', '#8E44AD', '#27AE60', '#F1C40F', '#9B59B6', '#1ABC9C', '#E67E22',
        '#C0392B', '#2980B9', '#34495E', '#E74C3C', '#16A085', '#F39C12', '#BDC3C7', '#D4AC0D',
      ];
      userColors[name] = colors[hash % colors.length];
    }
    return userColors[name];
  };
  