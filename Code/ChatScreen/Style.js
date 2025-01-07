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
        maxWidth: '90%',
        paddingHorizontal: 10,
        borderRadius: 15,
        flexDirection: "row-reverse",
        marginBottom: 10,
        alignItems: 'flex-end'
      },
      othermessageBubble: {
        maxWidth: '90%',
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
      messageTextBoxAdmin: {
        flexDirection:'column',
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
        // alignSelf: 'flex-start',
        color:config.colors.hasBlockGreen,
        fontSize: 12,
        fontFamily:'Lato-Bold'

      },
      adminText: {
        fontSize: 12,
        color: 'gray', 
        paddingTop:5
      },
      login: {
        height: 60,
        justifyContent: 'center',
        color: config.colors.hasBlockGreen,
        alignSelf: 'center',
        width: '100%',
        borderTopWidth:1,
        borderColor: isDarkMode ? '#333333' : '#cccccc',

        //  borderRadius:10
  
      },
      loginText: {
        color: config.colors.hasBlockGreen,
        fontFamily: 'Lato-Bold',
        textAlign: 'center',
        lineHeight: 24
  
      },
          inputWrapper: {
            padding: 10,
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? '#333' : '#ddd',
            backgroundColor: isDarkMode ? '#222' : '#fff',
          },
          replyContainer: {
            backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
            padding: 10,
            borderRadius: 8,
            marginBottom: 10,
          },
          replyText: {
            color: isDarkMode ? '#fff' : '#333',
            fontSize: 14,
          },
          cancelReplyButton: {
            alignSelf: 'flex-end',
            
          },
          cancelReplyText: {
            color: '#E74C3C',
            fontSize: 12,
          },
          inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
          },
          input: {
            flex: 1,
            backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
            borderRadius: 20,
            paddingHorizontal: 15,
            paddingVertical: 10,
            fontSize: 16,
          },
          sendButton: {
            marginLeft: 10,
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 10,
          },
          sendButtonText: {
            color: '#fff',
            fontSize: 16,
          },
          replyContainer: {
            backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
            borderLeftWidth: 3,
            borderLeftColor: isDarkMode ? '#1E88E5' : '#007BFF',
            padding: 5,
            marginBottom: 5,
            borderRadius: 5,
          },
          replyText: {
            fontSize: 10,
            color: isDarkMode ? '#1E88E5' : '#007BFF',
            width:'95%'

          },
          replySenderText: {
            fontSize: 12,
            fontFamily: 'Lato-Bold',
            color: isDarkMode ? '#FFF' : '#000',
          },
          profileImage:{
            height:20,
            width:20
          },
          userName:{
            color: '#bbb',
            fontSize:12

          },
          adminActions:{
            flexDirection:'column',
          },
          dot:{
            color: '#bbb',
            marginHorizontal:5,
            fontSize:14
          },
          linkText: {
            color: '#1E90FF', // Blue color for links
            textDecorationLine: 'underline', // Underline to indicate a link
          },
       
      
    });