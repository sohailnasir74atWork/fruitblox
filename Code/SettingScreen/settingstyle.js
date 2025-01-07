import { StyleSheet } from "react-native";
import config from "../Helper/Environment";

export const getStyles = (isDarkMode) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
        padding: 16,
      },
      cardContainer: {
        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: 10,
        padding: 10,
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
      },
      userName: {
        fontSize: 18,
        fontWeight: '600',
        color: isDarkMode ? '#fff' : '#000',
      },
      reward: {
        fontSize: 14,
        color: isDarkMode ? '#ccc' : '#666',
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
        fontWeight: '600',
        marginBottom: 15,
      },
      drawerSubtitle: {
        fontSize: 16,
        marginBottom: 10,
      },
      input: {
        backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
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
        fontFamily:'Lato-Bold'
      },
      rewardDescription:{
        color: isDarkMode ? '#fff' : '#000',
        fontFamily:'Lato-Regular'

      }
    });
  