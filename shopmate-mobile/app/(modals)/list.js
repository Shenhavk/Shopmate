import { StyleSheet, FlatList, Image, TextInput, TouchableOpacity, Button,ScrollView, Alert, RefreshControl,  } from 'react-native';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import Colors from '@/constants/Colors';
import { API_URL,IP_ADDR } from '@/constants/config';
import ModalPopup from '@/components/ModalPopup';
import { postData, putData, fetchData, deleteData, patchData } from '@/constants/apiInstance.js';
import { useAuth } from '@/contexts/AuthContext';

export default function ModalScreen() {
    const { listId } = useLocalSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [shoppingList, setShoppingList] = useState({});
    const [filteredItems, setFilteredItems] = useState([]);
    const [visible, setVisible] = useState(false);
    const [visibleItem, setVisibleItem] = useState(null);
    const [comparisonOptions, setComparisonOptions] = useState([]);
    const [showItemForm, setshowItemForm] = useState(false);
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = () => {
      setRefreshing(true);
      setTimeout(() => {
        setRefreshing(false);
      }, 2000)
    };

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    // Debounce timer for API calls
    const [debounceTimer, setDebounceTimer] = useState(null);
    const API_ENDPOINT = `http://${IP_ADDR}:5000/api/items`;
    const fetchItemSuggestions = async (query) => {
      if (!query.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      };

      try {
        const response = await fetch(`${API_ENDPOINT}?name=${query}&limit=10`);
        
        if (!response.ok) {
          // throw new Error('Failed to fetch suggestions');
          return;
        }

        const data = await response.json();
        // //console.log(data);

        let itemSuggestions = data?.items || data || [];

        itemSuggestions= Array.from(
          new Map(itemSuggestions?.map(item => [item?.ItemNm, item])).values()
        );
        //console.log('itemSuggestions',itemSuggestions);
        
        setSuggestions(itemSuggestions);
        setShowSuggestions(itemSuggestions.length > 0);
      } catch (error) {
        // console.error('Error fetching suggestions:', error);
        
        // Fallback to mock data for demo purposes
        const mockSuggestions = [
          { id: 1, name: 'Milk' },
          { id: 2, name: 'Bread' },
          { id: 3, name: 'Eggs' },
          { id: 4, name: 'Butter' },
          { id: 5, name: 'Cheese' },
        ].filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase())
        );
        
        setSuggestions(mockSuggestions);
        setShowSuggestions(mockSuggestions.length > 0);
      } finally {
        setIsLoading(false);
      }
    };
    // Handle text input change with debouncing
    const handleItemNameChange = (text) => {
      setName(text);

      // Clear previous timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new timer for debounced API call
      const timer = setTimeout(() => {
        fetchItemSuggestions(text);
      }, 300); // 300ms debounce delay

      setDebounceTimer(timer);
    };
    const handleSuggestionSelect = (suggestion) => {
      setName(suggestion.ItemNm);
      setShowSuggestions(false);
      setSuggestions([]);
    };
    // Render suggestion item
    const renderSuggestion = ({ item }) => (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionSelect(item)}
      >
        <Text style={styles.suggestionText}>{item.ItemNm}</Text>
      </TouchableOpacity>
    );
    const { token } = useAuth();

    const [storevisibleModal, setstoreVisibleModal] = useState(false);

    const openPopup = (item) => {
        setVisible(true);
        setVisibleItem(item)
    }

    const closePopup = () => {
        setVisible(false);
        setVisibleItem([])
    }

    const openStorePopup = () => {
      setstoreVisibleModal(true);
      ComparePricesForStores()
    }

    const closeStorePopup = () => {
      setstoreVisibleModal(false);
    }

    useEffect(()=>{
        handleFetchList()
    },[searchQuery, refreshing]);

    const handleFetchList = async()=>{
        const result = await fetchData(`${API_URL}/api/shopping-lists/list/${listId}`,token);
        // //console.log(result)
        if(result.status){
            setShoppingList(result?.result);
            // //console.log('items',result?.result?.items)
            if (searchQuery.trim() === '') {
                setFilteredItems(result?.result?.items || []);
            } else {
                const query = searchQuery.toLowerCase();
                const filtered = result?.result?.items.filter(item =>
                    item?.name?.toLowerCase().includes(query)
                );
                setFilteredItems(filtered);
            }
        }else{
            //console.log(result?.result?.error);
            Alert.alert("Items could not be retrieved", result?.result?.error || "Try again");
        };
    };

    const handleDeleteList = async()=>{
        if (!listId) {
            Alert.alert('Error Deleting List', '');
            return;
        };
        const result = await patchData(`${API_URL}/api/shopping-lists/list/soft_delete/${listId}`,{},token)

        if(result.status){
            Alert.alert("List deleted",);
            router.replace(`/(tabs)/lists`)
        }else{
            //console.log(result?.result?.error);
            Alert.alert("List could not be deleted", result?.result?.error || "Try again");
        };
    };

    const handleRestoreDeletedList = async()=>{
        if (!listId) {
            Alert.alert('Error Restoring List', '');
            return;
        };
        const result = await patchData(`${API_URL}/api/shopping-lists/list/restore/${listId}`,{},token)

        if(result.status){
            Alert.alert("List restored",);
            router.replace(`/(tabs)/lists`)
        }else{
            //console.log(result?.result?.error);
            Alert.alert("List could not be restored", result?.result?.error || "Try again");
        };
    };

    const handleAddItem = async() => {
        if (!name || !quantity) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        const quantityNum = parseInt(quantity);
        if (isNaN(quantityNum) || quantityNum <= 0) {
            Alert.alert('Invalid Quantity', 'Quantity must be a positive number.');
            return;
        };
        const result = await postData(`${API_URL}/api/shopping-lists/list/${listId}/item/add`,{ name, quantity: quantityNum },token);
        if(result.status){
            setName('');
            setQuantity('');
            setshowItemForm(false);
            await handleFetchList();
        }else{
            //console.log(result?.result?.error);
            Alert.alert("Item could not be added", result?.result?.error || "Try again");
        };
    };

    const handleDeleteItem = async(itemId)=>{
        if (!itemId) {
            Alert.alert('Error Deleting Item', '');
            return;
        };
        const result = await deleteData(`${API_URL}/api/shopping-lists/list/${listId}/item/${itemId}`,token);
        if(result.status){
            await handleFetchList();
        }else{
            //console.log(result?.result?.error);
            Alert.alert("Item could not be deleted", result?.result?.error || "Try again");
        };
    };

    const handleUpdateItem = async (itemId,quantity)=>{
        try {
            const quantityNum = parseInt(quantity);
            if (!itemId) {
              Alert.alert("Error", "Item Id missing");
              return;
            }
            if (quantityNum <= 0) {
              Alert.alert("Error", "Quantity can not be zero");
              return;
            }
            const result = await putData(`${API_URL}/api/shopping-lists/list/${listId}/item/update`,{ itemId, quantity: quantityNum },token)
            if(result?.status){
                await handleFetchList()
            }else{
              //console.log(result?.result?.error);
              Alert.alert("Quantity update", "Failed, Try again");
            };
        } catch (err) {
          //console.log(err)
          Alert.alert("Quantity update", err || "Try again");
        }
    };

    const ComparePricesForStores=async()=>{
      // //console.log('ComparePricesForStores1',filteredItems.map(item => item?.name))
      if (filteredItems.map(item => item?.name)?.length == 0 ){
        return;
      }
      const url = `http://${IP_ADDR}:5000/api/list/compare`;
      const options = {
          method: 'POST',
          body: JSON.stringify({
            "items":filteredItems.map(item => item?.name)
          }),
          headers:{
            "Content-Type":'application/json'
          }
      };
      try {
          const response = await fetch(url, options);
          let result = await response.text();
          result = JSON.parse(result);
          // //console.log('ComparePricesForStores2',result);
          setComparisonOptions(result);
      } catch (error) {
          //console.log(error);
      }
    };

    const updateShoppingListWithStore=async(data)=>{
      //console.log('updateShoppingListWithStore',data);
      if(!data) return //console.log('No data found',data)
      try {
          if (!data) {
            Alert.alert("Error", "Could not update list with prices from store");
            return;
          };
          const result = await patchData(`${API_URL}/api/shopping-lists/list/${listId}`,data,token)
          if(result?.status){
              await handleFetchList()
              closePopup()
          }else{
            //console.log(result?.result?.error);
            Alert.alert("List update", "Failed, Try again");
          };
      } catch (err) {
        //console.log(err)
        Alert.alert("List update", err || "Try again");
      }
    }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['grey']}
            progressBackgroundColor={'black'}
          />
        }>
        <View style={styles.row}>
          <Text style={styles.title}>{shoppingList?.name}</Text>
          <View style={styles.row}>
            {shoppingList?.isDeleted? (
              <TouchableOpacity style={[styles.removeButtonIcon,{backgroundColor:Colors.light.primary}]} onPress={()=>handleRestoreDeletedList()}>
                <Text style={styles.removeButtonText}>Restore</Text>
              </TouchableOpacity>
            ):(
              <TouchableOpacity style={styles.removeButtonIcon} onPress={()=>handleDeleteList()}>
                <Text style={styles.removeButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
            {!shoppingList?.isDeleted && (
              <TouchableOpacity style={styles.StartShoppingButton} onPress={()=> router.replace(`/(tabs)/cart?listId=${listId}`)}>
                <Text style={styles.StartShoppingButtonText}>Start Shopping</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.description}>{shoppingList?.description}</Text>
        <View style={styles.storeContainer}>
          <View style={styles.row}>
            <Text style={styles.title}>{shoppingList?.storeName || 'No store selected'}</Text>
            <Text style={styles.basketTotalPrice}> ILS {shoppingList?.total?.toFixed(2)} </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.description}>Branch</Text>
            <Text style={styles.description}>{shoppingList?.branch}</Text>
          </View>
          {!shoppingList?.isDeleted && (
            <Text style={styles.actionText} onPress={()=>openStorePopup()}>Compare stores</Text>
          )}
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {!shoppingList?.isDeleted && (
            <TouchableOpacity style={styles.addButton} onPress={()=>setshowItemForm(!showItemForm)}>
              <Text style={styles.addButtonText}>{!showItemForm ? "Add Item" : "Close"}</Text>
            </TouchableOpacity>
          )}
        </View>
        {showItemForm && (
          <View style={styles.form}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Milk"
              value={name}
              onChangeText={handleItemNameChange}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {/* Suggestions List */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.id?.toString() || item.name}
                  renderItem={renderSuggestion}
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              </View>
            )}
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddItem}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.itemsContainer}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View 
              style={[
                styles.itemCard,
                shoppingList?.storeName ? 
                item.priceInfo?.price > 0 ? { backgroundColor: Colors.light.white } : { backgroundColor: '#f8bbbbff' } 
                : { backgroundColor: Colors.light.white }
              ]}>              
              <View 
                style={[
                  styles.itemInfo,
                  shoppingList?.storeName ? 
                  item.priceInfo?.price > 0 ? { backgroundColor: Colors.light.white } : { backgroundColor: '#f8bbbbff' } 
                  : { backgroundColor: Colors.light.white }
                ]}>
                {/* Title and Price */}
                <View
                  style={[
                    styles.row,
                    shoppingList?.storeName ? 
                    item.priceInfo?.price > 0 ? { backgroundColor: Colors.light.white } : { backgroundColor: '#f8bbbbff' } 
                    : { backgroundColor: Colors.light.white }
                  ]}>
                  <Text style={styles.itemName}>
                    {item.name}
                  </Text>
                </View>

                {/* Added by / Modified by */}
                <Text style={styles.itemDetails}>
                  Added by: {item?.history?.[0]?.userId?.name || 'Unknown'}
                </Text>

                <Text style={styles.itemDetails}>
                  Last Modified by: {item?.history?.[item?.history?.length - 1]?.userId?.name || 'Unknown'}
                </Text>

                {/* Status */}
                <Text style={styles.itemDetails}>
                  Status: {item.status}
                </Text>

                {/* Controls: -, quantity, +, remove */}
                {shoppingList?.storeName && (item.priceInfo?.price > 0 && shoppingList?.storeName ? '': <Text style={styles.itemDetails}>not available in store</Text>)}
                <View
                  style={[
                    styles.controls,
                    shoppingList?.storeName ? 
                    item.priceInfo?.price > 0 ? { backgroundColor: Colors.light.white } : { backgroundColor: '#f8bbbbff' } 
                    : { backgroundColor: Colors.light.white }
                  ]}>
                  <TouchableOpacity style={styles.controlButton} onPress={()=>{handleUpdateItem(item?._id, item?.quantity - 1)}}>
                    <Text style={styles.controlText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.controlButton} onPress={()=>{handleUpdateItem(item?._id, item?.quantity + 1)}}>
                    <Text style={styles.controlText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeButtonIcon} onPress={()=>handleDeleteItem(item?._id)}>
                    <Text style={styles.removeButtonText}>remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
        <ModalPopup
          isVisible={visible}
          transparent={true}
          dismiss={closePopup}
          title={`${visibleItem?.option?.storeName} - ${visibleItem?.option?.branch} \nILS ${visibleItem?.totalAmount?.toFixed(2)}`}
        >
          <ScrollView 
            contentContainerStyle={styles.priceList}
          >
            {visibleItem?.combinedItems?.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={option?.price > 0 ? styles.priceCard : styles.priceCardMissing}
                // onPress={() => handleUpdateItemPrice(visibleItem?._id,option.storeName,parseInt(option.price))} // This would apply the selected price to the item
              >
                <View style={option?.price > 0 ? styles.priceInfo: styles.priceInfoMissing}>
                  <Text style={styles.itemName}>{option?.name}</Text>
                  <Text style={styles.itemPrice}>
                    QTY: {option?.quantity}
                  </Text>
                  <Text style={styles.itemPrice}>
                    Price/unit: {option?.price}
                  </Text>
                  <Text style={styles.itemPrice}>
                    Total: ILS {option?.price * option?.quantity}
                  </Text>
                  {option?.price == 0 && (
                    <Text style={styles.itemPrice}>not available</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ModalPopup>
        <ModalPopup
          isVisible={storevisibleModal}
          transparent={true}
          dismiss={closeStorePopup}
          title={`Compare stores`}
        >
          <ScrollView contentContainerStyle={styles.priceList}>
            {comparisonOptions?.map((option, index) => {
                //console.log('option',option)
                const priceMap = new Map(option?.items.map(item => [item.name, item.price]));

                let totalAmount = 0;
                let missingItemsFromStore = 0

                const combinedItems = filteredItems?.map(item => {
                  //console.log('combinedItems',item)
                  const price = priceMap.get(item?.name) || 0;
                  const total = item?.quantity * price;
                  totalAmount += total;
                  if(total == 0){
                    missingItemsFromStore += 1
                  };
                  return {
                    item,
                    name: item?.name,
                    quantity: item?.quantity,
                    price: price,
                    total: total,
                  }
                });

                //console.log("combinedItems", combinedItems);
                return(
                <TouchableOpacity
                  key={index}
                  style={styles.priceCard}              
                >
                  <View style={styles.priceInfo}>
                    <Text style={styles.itemName}>{option?.storeName}</Text>
                    <Text style={styles.itemPrice}>
                      ILS {totalAmount?.toFixed(2)}
                    </Text>
                    <Text style={styles.storeName}>branch: {option?.branch} </Text>
                    {missingItemsFromStore > 0 && (<Text style={styles.missingItemsFromStoreBadge}>{missingItemsFromStore || 0} items are missing from store</Text>)}
                    <View style={{flexDirection:'row',backgroundColor:Colors.light.secondary,marginTop:2}}>
                      <TouchableOpacity style={styles.StartShoppingButton}  onPress={() => openPopup({option,combinedItems,totalAmount})}>
                        <Text style={styles.StartShoppingButtonText}>View Items</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.StartShoppingButton} onPress={() => updateShoppingListWithStore({storeName: option?.storeName,branch: option?.branch,total: totalAmount ,items: combinedItems,})}>
                        <Text style={styles.StartShoppingButtonText}>Select this store</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            )}
          </ScrollView>
        </ModalPopup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.light.base,
  },
  row:{
    justifyContent: 'space-between',
    flexDirection: 'row',
    flex: 1,
    // backgroundColor: Colors.light.white,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    color: '#666',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: Colors.light.base,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.base,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.light.white,
    borderColor: Colors.light.secondary,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    color: Colors.light.secondary,
    fontWeight: '600',
  },
  itemsContainer: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: Colors.light.white,
    color: Colors.light.primary,
    borderRadius: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemCardNotAvailable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8bbbbff',
    color: Colors.light.primary,
    borderRadius: 10,
    shadowColor: Colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 6,
  },
  itemInfo: {
    flex: 1,
    backgroundColor: Colors.light.white,
  },
  itemInfoNotAvailable: {
    flex: 1,
    backgroundColor: '#f8bbbbff',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.secondary,
  },
  itemStore: {
    fontSize: 12,
  },
  itemDetails: {
    fontSize: 12,
    color: '#555',
  },
  removeButton: {
    padding: 6,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    marginLeft: 8,
    marginTop: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  controlButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 4,
  },
  controlText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  removeButtonIcon: {
    backgroundColor: '#ef4444',
    padding: 6,
    borderRadius: 6,
  },
  form: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  label: {
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.light.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionText: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  compareButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  compareButtonText: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceList:{
    padding: 20,
    height: '250',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  priceList: {
    padding: 10,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    backgroundColor: Colors.light.secondary,
    color: Colors.light.primary,
  },
  priceCardMissing: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    backgroundColor: '#fe8569',
    color: Colors.light.primary,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  priceInfo: {
    flex: 1,
    backgroundColor: Colors.light.secondary,
  },
  priceInfoMissing: {
    flex: 1,
    backgroundColor: '#fe8569',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    color: '#333',
  },
  storeName: {
    fontSize: 12,
    color: '#777',
  },
  StartShoppingButton: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 8,
    padding: 6,
    marginLeft: 10,
  },
  StartShoppingButtonText: {
    color: Colors.light.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  storeContainer:{
    marginVertical: 10,
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    borderColor: Colors.light.secondary
  },
  basketTotalPrice: {
    fontSize: 14,
    color: Colors.light.secondary,
    fontWeight: '500'
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    backgroundColor:  Colors.light.secondary,
    borderRadius:10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 2000,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  missingItemsFromStoreBadge:{
    backgroundColor: '#fe8569',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 10,
    width: 200,
    fontSize: 12
  }
});
