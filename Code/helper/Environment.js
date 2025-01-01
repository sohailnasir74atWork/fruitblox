const isNoman = true; // Toggle this to switch configurations

// noman app id = ca-app-pub-5740215782746766~2511096424
//waqas app id = ca-app-pub-3701208411582706~4267174419
// noman pkgName= com.bloxfruitevalues
//waqas pkgName = com.bloxfruitstock

const config = {
  appName: isNoman ? 'Blox Fruit Values' : 'Blox Fruit Stock',
  andriodBanner: isNoman ? 'ca-app-pub-5740215782746766/5225162749' : 'ca-app-pub-3701208411582706/4133745803',
  andriodIntestial: isNoman ? 'ca-app-pub-5740215782746766/1206026687' : 'ca-app-pub-3701208411582706/2820664136',
  IOsIntestial: isNoman ? 'ca-app-pub-5740215782746766/3209373499' : '',
  IOsBanner: isNoman ? 'ca-app-pub-5740215782746766/4522455164' : '',

  supportEmail: isNoman ? 'thesolanalabs@gmail.com' : 'mindfusionio.help@gmail.com',
  andriodShareLink: isNoman ? 'https://play.google.com/store/apps/details?id=com.bloxfruitevalues' : 'https://play.google.com/store/apps/details?id=com.bloxfruitstock',
  IOsShareLink: isNoman ? 'https://apps.apple.com/us/app/app-name/id6737775801' : '',
  IOsShareLink: isNoman ? 'https://apps.apple.com/us/app/app-name/id6737775801' : '',
  webSite: isNoman ? 'https://bloxfruitscalc.com/' : 'https://bloxfruitvalue.today',

  isNoman: isNoman ? true : false,


  colors: isNoman
    ? {
      primary: '#4E5465', // Muted grayish blue
      secondary: '#3E8BFC', // Bright action blue
      hasBlockGreen: '#29AB87', // Vibrant success green
      wantBlockRed: '#FF3B30', // Vivid warning red
      backgroundLight: '#f2f2f7',
      backgroundDark: '#121212',
      white:'white',
      black:'black'
    }
    : {
      primary: '#697565', // Deep navy blue
      secondary: '#457B9D', // Muted teal
      hasBlockGreen: '#B8860B', // Light mint green
      wantBlockRed: '#E63946', // Warm, soft red
      backgroundLight: '#f2f2f7',
      backgroundDark: '#121212',
       white:'white',
      black:'black'
    },

};

export default config;
