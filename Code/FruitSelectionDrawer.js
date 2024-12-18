import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Pressable, useColorScheme } from 'react-native';

const FruitSelectionDrawer = ({ visible, onClose, onSelect, data, selectedTheme }) => {
  const [searchText, setSearchText] = useState('');
  const filteredData = data.filter((item) =>
    item.Name.toLowerCase().includes(searchText.toLowerCase())
  );
  const colorScheme = useColorScheme(); // Returns 'light' or 'dark'

  const isDarkMode = colorScheme === 'dark';



  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <Pressable onPress={()=>{}}>
      <View style={[styles.drawer, {backgroundColor: isDarkMode ?  '#3B404C' : 'white'}]}>
          <Text style={[styles.title, {color:selectedTheme.colors.text}]}>Select a Fruit</Text>
          <View style={styles.header}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closetext}>Close</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.Name}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.itemBlock} onPress={() => onSelect(item)}>
              <Image
                source={{
                  uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${item.Name.replace(
                    /^\+/,
                    ''
                  ).replace(/\s+/g, '-')}_Icon.webp`,
                }}
                style={styles.icon}
              />
              <Text style={styles.itemText}>{item.Name}</Text>
              <Text style={styles.itemText}>{item.Value}</Text>
            </TouchableOpacity>
          )}
          numColumns={3}
            contentContainerStyle={styles.flatListContainer}
            columnWrapperStyle={styles.columnWrapper}
        />
      </View></Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: {  borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 10,
    paddingTop:20,
    height: 400,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
//   search: { flex: 1, borderBottomWidth: 1, borderColor: '#CCC', marginRight: 10 },
//   closeText: { fontSize: 14, color: '#FF3B30' },
  itemBlock: {
    width: '32%',
    height: 110,
    backgroundColor: '#4E5465',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
    position: 'relative',
  },   flatListContainer: {
    justifyContent: 'space-between',
  },
  columnWrapper: {
    flex: 1,
    justifyContent: 'space-around',
  },icon: { width: 40, height: 40, alignSelf:'center' },
  itemText: { fontSize: 16, color:'white' },
  searchInput: {
    width: '78%',
    borderColor: 'grey',
    borderWidth: 1,
    borderRadius: 5,
    height: 48,
    borderColor: '#333',       
    borderWidth: 1,          
    borderRadius: 5,          
    paddingHorizontal: 10,    
    backgroundColor: '#fff',  
    color: '#000',  
    marginVertical:10
          
  },
  closeButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    width: '22%',
    alignItems:'center',
    justifyContent:'center',
    height: 48,
marginVertical:10
  },
  closetext:{
    color:'white'
  }
});

export default FruitSelectionDrawer;
