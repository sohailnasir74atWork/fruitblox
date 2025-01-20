import { StyleSheet } from "react-native";
import config from "../Helper/Environment";

export const getStyles = (isDarkMode) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
        padding: 8,
      },
      cardContainer: {
        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal:5,
        marginBottom: 10,
      },
      optionuserName: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
      },
      profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 10,
        backgroundColor:'white'

      },
      profileImage2: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor:'white'
      },
      userName: {
        fontSize: 18,
        fontFamily:'Lato-Bold',
        color: isDarkMode ? '#fff' : '#000',
      },
      reward: {
        fontSize: 14,
        color: isDarkMode ? '#ccc' : '#666',
        fontFamily:'Lato-Regular'
      },
      option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? '#333333' : '#cccccc',
      },
      optionLast: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomColor: isDarkMode ? '#333333' : '#cccccc',
      },
      optionText: {
        fontSize: 16,
        marginLeft: 10,
        color: isDarkMode ? '#fff' : '#000',
        fontFamily:'Lato-Regular',
        lineHeight:24
      },
      overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
      drawer: {
        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      drawerTitle: {
        fontSize: 18,
        marginBottom: 15,
        fontFamily:'Lato-Bold'

      },
     
      input: {
        backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
        color: isDarkMode ? '#fff' : '#000',
      },
      imageOption: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginHorizontal: 10,
        borderWidth: 2,
        borderColor: '#007BFF',
      },
      saveButton: {
        backgroundColor: config.colors.primary,
        paddingVertical: 15,
        borderRadius: 20,
        marginTop: 20,
      },
      saveButtonText: {
        color: '#fff',
        textAlign: 'center',
      },
      drawerSubtitle:{
        color: isDarkMode ? '#fff' : '#000',
        fontFamily:'Lato-Bold',
        marginBottom:10
      },
      drawerSubtitleUser:{
        color: isDarkMode ? '#fff' : '#000',
        fontFamily:'Lato-Bold',
        // marginBottom:10
      },
      subtitle:{
        color: isDarkMode ? '#fff' : '#000',
        fontFamily:'Lato-Bold',
        marginVertical:10
      },
      rewardDescription:{
        color: isDarkMode ? '#fff' : '#000',
        fontFamily:'Lato-Regular',
        fontSize:12

      },
      optionTextLogout:{
        fontSize: 16,
        marginLeft: 10,
        color:config.colors.wantBlockRed,
        fontFamily:'Lato-Regular'
      },
      optionTextDelete:{
        fontSize: 16,
        marginLeft: 10,
        color:!isDarkMode ? '#5A1F1F' : '#FFE5E5',
        fontFamily:'Lato-Regular'

      },
      optionDelete: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomColor: isDarkMode ? '#333333' : '#cccccc',
        backgroundColor: isDarkMode ? '#5A1F1F' : '#FFE5E5',
        fontFamily:'Lato-Regular'

      },
      containertheme:{
        flexDirection:'row',
        borderWidth:1,
        borderRadius:50,
        borderColor: config.colors.hasBlockGreen,
      },
      box: {
        paddingVertical: 7,
        paddingHorizontal: 10,
        // backgroundColor: '#ccc',
        alignItems: 'center',
        justifyContent: 'center',
        color:'white',
        fontFamily:'Lato-Regular',
        borderRadius:50,



      },
      selectedBox: {
        backgroundColor: config.colors.hasBlockGreen, // Highlight selected box
      },
      text:{
        fontFamily:'Lato-Regular',
        fontSize:10,
        color: isDarkMode ? '#fff' : '#000',

      },
      selectedText:{
        color:'white',
        fontFamily:'Lato-Regular',
        fontSize:10,
      }
    });
  