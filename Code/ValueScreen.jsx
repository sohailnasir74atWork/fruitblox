import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image, FlatList, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import debounce from 'lodash.debounce';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import getAdUnitId from './ads';
import { useGlobalState } from './GlobelStats';

const bannerAdUnitId = getAdUnitId('banner');

const ValueScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data } = useGlobalState();
  const valuesData = useMemo(() => (data ? Object.values(data) : []), [data]);
  const filters = ['ALL', 'COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'MYTHICAL', 'GAME PASS'];

  const displayedFilter = selectedFilter === 'PREMIUM' ? 'GAME PASS' : selectedFilter;

  const formatName = (name) => name.replace(/^\+/, '').replace(/\s+/g, '-');

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter === 'GAME PASS' ? 'PREMIUM' : filter);
    setFilterDropdownVisible(false);
  };

  const handleSearchChange = debounce((text) => {
    setSearchText(text);
  }, 300);

  useEffect(() => {
    setLoading(true);
    const filtered = valuesData.filter((item) => {
      const itemType = item.Type.toUpperCase() === 'GAME PASS' ? 'PREMIUM' : item.Type.toUpperCase();
      return (
        item.Name.toLowerCase().includes(searchText.toLowerCase()) &&
        (selectedFilter === 'ALL' || itemType === selectedFilter)
      );
    });
    setFilteredData(filtered);
    setLoading(false);
  }, [searchText, selectedFilter]);
  const closeDropdown = () => {
    if (filterDropdownVisible) setFilterDropdownVisible(false);
  };

  const renderFilterOptions = () => (
    <View style={styles.filterDropdownContainer}>
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterOption,
            { backgroundColor: selectedFilter === filter ? '#34C759' : '#F2F2F2' },
          ]}
          onPress={() => handleFilterChange(filter)}
        >
          <Text
            style={[
              styles.filterTextOption,
              { color: selectedFilter === filter ? '#FFF' : '#333' },
            ]}
          >
            {filter}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image
        source={{ uri: `https://bloxfruitscalc.com/wp-content/uploads/2024/09/${formatName(item.Name)}_Icon.webp` }}
        style={styles.icon}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.Name}</Text>
        <Text style={styles.value}>Value: ${item.Value.toLocaleString()}</Text>
        <Text style={styles.permanentValue}>Permanent: ${item.Permanent.toLocaleString()}</Text>
        <Text style={styles.beliPrice}>Beli Price: ${item.Biliprice.toLocaleString()}</Text>
        <Text style={styles.robuxPrice}>Robux Price: ${item.Robuxprice}</Text>
      </View>
      <View style={styles.statusContainer}>
        <Text
          style={[
            styles.status,
            { backgroundColor: item.Stability === 'Stable' ? '#34C759' : '#FF3B30' },
          ]}
        >
          {item.Stability}
        </Text>
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={closeDropdown}>
      <View style={styles.container}>
        <Text style={styles.description}>
          Live Blox Fruits values updated hourly. Find accurate item values here and visit the trade feed for fruits or game passes.
        </Text>

        <View style={styles.containerBannerAd}>
          <BannerAd
            unitId={bannerAdUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>

        <View style={styles.searchFilterContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#888"
            onChangeText={handleSearchChange}
          />
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => setFilterDropdownVisible(!filterDropdownVisible)}
          >
            <Text style={styles.filterText}>{displayedFilter}</Text>
            <Icon name="chevron-down-outline" size={18} color="#333" />
          </TouchableOpacity>
        </View>

        {filterDropdownVisible && renderFilterOptions()}


        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.Name}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          contentContainerStyle={styles.listContent}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8, backgroundColor: '#F5F5F5' },
  searchFilterContainer: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  searchInput: { flex: 1, backgroundColor: '#E0E0E0', padding: 10, borderRadius: 10, marginRight: 10, height: 48 },
  filterDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0E0E0', padding: 10, borderRadius: 10, height: 48 },
  filterDropdownContainer: { position: 'absolute', top: 80, right: 10, width: 150, backgroundColor: '#FFF', borderRadius: 8, elevation: 3, zIndex: 1 },
  filterOption: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  filterTextOption: { fontSize: 14 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, elevation: 1 },
  icon: { width: 50, height: 50, borderRadius: 5, marginRight: 10 },
  infoContainer: { flex: 1 },
  name: { fontSize: 16, fontFamily: 'Lato-Bold' },
  value: { fontSize: 12, fontFamily: 'Lato-Regular' },
  permanentValue: { fontSize: 12, fontFamily: 'Lato-Regular' },
  beliPrice: { fontSize: 12, fontFamily: 'Lato-Regular' },
  robuxPrice: { fontSize: 12, fontFamily: 'Lato-Regular' },
  statusContainer: { alignItems: 'center' },
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, color: '#FFF', fontSize: 12, fontFamily: 'Lato-Bold' },
  filterText: { fontSize: 16, fontFamily: 'Lato-Regular', marginRight: 5 },
  description: { fontSize: 14, lineHeight: 18, color: '#333', marginVertical: 10, fontFamily: 'Lato-Regular' },
  loadingIndicator: { marginVertical: 20, alignSelf: 'center' },
  containerBannerAd: { justifyContent: 'center', alignItems: 'center', paddingVertical: 5 },
  listContent: { paddingBottom: 70 },
});

export default ValueScreen;
