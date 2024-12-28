const isNoman = true; // Toggle this to switch configurations

const config = {
appName: isNoman ? 'Noman App' : 'Waqas App',
andriodBanner: isNoman ? 'ca-app-pub-5740215782746766/5225162749' : 'ca-app-pub-5740215782746766/5225162749', 
andriodIntestial:isNoman ? 'ca-app-pub-5740215782746766/1206026687' : 'ca-app-pub-5740215782746766/1206026687',
IOsIntestial:isNoman ? 'ca-app-pub-5740215782746766/3209373499' : '',
IOsBanner: isNoman ? 'ca-app-pub-5740215782746766/4522455164' : '', 

supportEmail: isNoman ? 'thesolanalabs@gmail.com' : 'mindfusionio.help@gmail.com',
andriodShareLink: isNoman ? 'https://play.google.com/store/apps/details?id=com.bloxfruitevalues' : 'https://play.google.com/store/apps/details?id=com.bloxfruitstock',
IOsShareLink: isNoman ? 'https://apps.apple.com/us/app/app-name/id6737775801' : '',
IOsShareLink: isNoman ? 'https://apps.apple.com/us/app/app-name/id6737775801' : '',
webSite: isNoman ? 'https://bloxfruitscalc.com/' : 'https://bloxfruitvalue.today',



  colors: isNoman
    ? {
        primary: '#3498db',
        secondary: '#2ecc71',
        background: '#ecf0f1',
        text: '#2c3e50', 
      }
    : {
        primary: '#e74c3c',
        secondary: '#9b59b6', 
        background: '#f5f5f5',
        text: '#333333',
      },
};

export default config;
