import { StyleSheet } from "react-native";
import config from "../Helper/Environment";

export  const getStyles = (isDarkMode) =>

    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: isDarkMode ? '#121212' : '#f2f2f7',
      },
      loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      chatList: {
        flexGrow: 1,
        justifyContent: 'flex-end',
        // paddingHorizontal: 10,
        paddingVertical: 5,
      },
      mymessageBubble: {
        maxWidth: '85%',
        paddingHorizontal: 10,
        borderRadius: 15,
        flexDirection: "row-reverse",
        marginBottom: 10,
        alignItems: 'flex-end'
      },
      othermessageBubble: {
        maxWidth: '85%',
        paddingHorizontal: 10,
        borderRadius: 15,
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'flex-end'
  
      },
      myMessage: {
        alignSelf: 'flex-end',
      },
      otherMessage: {
        alignSelf: 'flex-start',
      },
      senderName: {
        width: 34,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
      },
      senderNameText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
      },
      messageTextBox: {
        flex: 1,
      },
      myMessageText: {
        fontSize: 14,
        color: isDarkMode ? 'white' : 'black',
        backgroundColor: isDarkMode ? config.colors.primary : 'lightgreen',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        fontFamily:'Lato-Regular'
      },
      otherMessageText: {
        fontSize: 14,
        color: isDarkMode ? 'white' : 'black',
        backgroundColor: isDarkMode ? config.colors.primary : 'white',
        paddingHorizontal: 10,
        lineHeight:20,
        borderRadius: 20,
        paddingVertical: 5,
        fontFamily:'Lato-Regular'
      },
      timestamp: {
        fontSize: 10,
        color: '#bbb',
        textAlign: 'right',
        paddingHorizontal: 10
      },
      inputContainer: {
        flexDirection: 'row', // Maintains horizontal alignment with the send button
        alignItems: 'flex-start', // Align items at the top to allow wrapping
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
      },
      input: {
        flex: 1, // Ensures the input takes available space
        borderRadius: 20,
        padding: 10,
        marginRight: 10,
        fontSize: 16,
        minHeight: 40, // Minimum height for a single line
        maxHeight: 120, // Limit input growth to a max height
        textAlignVertical: 'top', // Ensures text starts at the top
        backgroundColor: isDarkMode ? '#333' : '#fff', // Optional background for better visibility
      },
  
      sendButton: {
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
      },
      sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
      },
      loggedOutMessage: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 10,
      },
      loggedOutMessageText: {
        color: '#bbb',
        textAlign: 'center',
      },
      dateSeparator: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginVertical: 10,
      },
      admin: {
        marginTop: 5,
        alignSelf: 'flex-start',
      },
      adminText: {
        fontSize: 12,
        color: 'gray', 
        paddingTop:5
      },
      login: {
        height: 60,
        justifyContent: 'center',
        backgroundColor: config.colors.hasBlockGreen,
        alignSelf: 'center',
        width: '100%',
        //  borderRadius:10
  
      },
      loginText: {
        color: 'white',
        fontFamily: 'Lato-Bold',
        textAlign: 'center',
        lineHeight: 24
  
      }
    });