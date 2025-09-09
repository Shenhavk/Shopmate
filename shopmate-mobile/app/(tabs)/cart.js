import { StyleSheet, FlatList, Image, TextInput, TouchableOpacity, Button, Alert, Pressable, ScrollView, RefreshControl } from 'react-native';
import { Text, View } from '@/components/Themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import Colors from '@/constants/Colors';
import { API_URL, IP_ADDR } from '@/constants/config';
import useFetch from '@/hooks/useFetch.hook';
import usePost from '@/hooks/usePost.hook';
import useDelete from '@/hooks/useDelete.hook';
import usePut from '@/hooks/usePut.hook';
import { postData, putData, fetchData, deleteData, patchData } from '@/constants/apiInstance.js';
import { useAuth } from '@/contexts/AuthContext';

export default function CartScreen() {
  const params = useLocalSearchParams();
  const [listId, setlistId] = useState(params?.listId);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuery, setfilterQuery] = useState('Pending');
  const [shoppingList, setShoppingList] = useState({});
  const [filteredItems, setFilteredItems] = useState([]);
  const { token } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
    

  
  let { data: shoppingListFetched, loading: shoppingListLoading, error: shoppingListError, refetch: shoppingListRefetch } = useFetch(`${API_URL}/api/shopping-lists/list/${listId}`);
  const { data: recommendshoppingList, loading: recommendshoppingListLoading, error: recommendshoppingListError, postData: recommendShoppingListPosted} = usePost(`${API_URL}/api/households/recommend/list`);
  let { data: userData, loading: userLoading, error, refetch } = useFetch(`${API_URL}/api/users/me`);
  let { data: householdMembers, loading: loadingMembers, refetch: refetchHouseHoldMembers  } = useFetch(`${API_URL}/api/households/members`);
  console.log("householdMembers",householdMembers?.members)

  useEffect(()=>{
    handleFetchList()
    refetchHouseHoldMembers()
  },[searchQuery,listId,filterQuery]);

  useEffect(()=>{
    refetchHouseHoldMembers()
  },[userLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    refetchHouseHoldMembers()
    handleFetchList()
    setTimeout(() => {
      setRefreshing(false);
    }, 2000)
  };

  const handleFetchList = async()=>{
      if (!listId) return;
      const result = await fetchData(`${API_URL}/api/shopping-lists/list/${listId}?status=${filterQuery}`,token);
      // console.log(result)
      if(result.status){
          setShoppingList(result?.result);
          // console.log('items',result?.result?.items);
          const items = result?.result?.items.filter((item)=> item?.priceInfo?.price > 0)
          if (searchQuery.trim() === '') {
              setFilteredItems(items.filter(item => item?.status.includes(filterQuery.toLowerCase())) || []);
          } else {
              const query = searchQuery.toLowerCase();
              const filtered = items.filter(item =>
                  item?.name?.toLowerCase().includes(query)
              );
              setFilteredItems(filtered.filter(item => item?.status.includes(filterQuery.toLowerCase())));
          }
          return items;
      }else{
        // console.log(result?.result?.error);
        Alert.alert("Items could not be retrieved", result?.result?.error || "Try again");
        return []
      };
  };

  const handleFilterByStatus=()=>{
    if(filterQuery == 'Pending'){
      setfilterQuery('Purchased')
    }else{
      setfilterQuery('Pending')
    }
  };

  const handlePurchaseItem = async(itemId)=>{
      try {
        if (!itemId) {
          Alert.alert("Error", "Item Id missing");
          return;
        }
        const result = await putData(`${API_URL}/api/shopping-lists/list/${listId}/item/purchase`,{ itemId },token)
        if(result?.status){
            await handleFetchList()
        }else{
          console.log(result?.result?.error);
        };
    } catch (err) {
      console.log(err)
    }
  };
  const handlePurchaseAllItems = async()=>{
      try {
        const items = await handleFetchList();
        const itemIds = items?.map(item => item?._id)
        const result = await postData(`${API_URL}/api/shopping-lists/list/${listId}/item/purchase/all`,{ itemIds },token)
        if(result?.status){
            await handleFetchList()
        }else{
          console.log(result?.result?.error);
        };
        // console.log("handlePurchaseAllItems",itemIds)
    } catch (err) {
      console.log(err)
    }
  };
  const handleReturnItem = async(itemId)=>{
      try {
        if (!itemId) {
          Alert.alert("Error", "Item Id missing");
          return;
        }
        const result = await putData(`${API_URL}/api/shopping-lists/list/${listId}/item/update`,{ itemId, status: 'pending' },token)
        if(result?.status){
            await handleFetchList()
        }else{
          console.log(result?.result?.error);
        };
    } catch (err) {
      console.log(err)
    }
  };
  const handleUpdateItem = async (itemId,quantity,status)=>{
      console.log(status)
      try {
          const quantityNum = parseInt(quantity);
          if (!itemId) {
              Alert.alert("Error", "Item Id missing");
              return;
          }
          if (status === 'purchased') {
              Alert.alert("Warning", "Item is already purchased");
              return;
          }
          if (quantityNum <= 0) {
              Alert.alert("Error", "Quantity can not be zero");
              return;
          };
          const result = await putData(`${API_URL}/api/shopping-lists/list/${listId}/item/update`,{ itemId, quantity: quantityNum },token)
          if(result?.status){
              await handleFetchList()
          }else{
              console.log(result?.result?.error);
              Alert.alert("Quantity update", "Failed, Try again");
          };
      } catch (err) {
          console.log(err)
          Alert.alert("Quantity update", err || "Try again");
      }
  };

  const handleClearCart = ()=>{
      setlistId('')
  };

  if(!listId || listId == null || listId == '') {
      return(
        <SafeAreaView style={{padding:16}}>
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['grey']}
                progressBackgroundColor={'black'}
              />
            }>
            <Text style={{fontSize:36,overflow:'wrap', marginVertical:20}}>Welcome, {userData?.user?.name}</Text>
              <View style={{flexDirection:'row',flex:1,height:100,alignItems:'center',justifyContent:'space-around'}}>
              <TouchableOpacity style={[styles.secondaryButtonIcon,{height:'100%',alignItems:'center',justifyContent:'center',width:165}]} onPress={()=>router.push(`/(tabs)/lists`)}>
                <Text style={styles.secondaryButtonText}>Go to your shopping lists</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.purchaseButtonIcon,{height:'100',alignItems:'center',justifyContent:'center',width:165}]} onPress={()=>router.push(`/(tabs)/recommend`)}>
                {/* <TouchableOpacity style={styles.purchaseButtonIcon} onPress={()=>router.push(`/(tabs)/recommend`)}> */}
                <Text style={styles.purchaseButtonText}>Recommend me a list</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.title,{marginVertical:10}]}>House Members</Text>
            <FlatList
              data={householdMembers?.members}
              keyExtractor={(item) => item._id}
              contentContainerStyle={[styles.itemsContainer,{marginVertical:10}]}
              scrollEnabled={false}
              ListEmptyComponent={householdMembers?.members?.length == 0 ? <Text>No Members found.</Text>:<Text>fetching members ...</Text>}
              renderItem={({ item }) => (
                <View style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    {/* Name */}
                    <View style={styles.row}>
                      <Text style={styles.itemName}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={{fontSize:14,fontWeight:'400'}}>
                        {item.email}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            />
          </ScrollView>
        </SafeAreaView>
      )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.title}>Cart</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.filterButtonIcon} onPress={()=>handleFilterByStatus()}>
            <Text style={styles.removeButtonText}>View {filterQuery == 'Pending' ? 'Purchased': 'Pending'}</Text>
          </TouchableOpacity>
          <Link href={`/(modals)/list?listId=${listId}`} asChild key={listId}>
            <TouchableOpacity style={styles.removeButtonIcon} onPress={()=>handleClearCart()}>
              <Text style={styles.removeButtonText}>Close</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
      <Text style={styles.description}>{shoppingList?.description}</Text>
      <View style={styles.storeContainer}>
        <View style={styles.row}>
          <Text style={styles.title}>@ {shoppingList?.storeName || 'no store selected'}</Text>
          <Text style={styles.basketTotalPrice}> ILS {shoppingList?.total?.toFixed(2)} </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.description}>Branch</Text>
          <Text style={styles.description}>{shoppingList?.branch}</Text>
        </View>
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
      </View>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.itemsContainer}
        ListEmptyComponent={filterQuery == 'Pending' && filteredItems?.length == 0 ? <Text>No Items left to buy</Text>: <Text>No Items have been bought</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              {/* Title and Price */}
              <View style={styles.row}>
                <Text style={styles.itemName}>
                  {item.name}
                </Text>
              </View>

              {/* Store */}
              <Text style={styles.itemStore}>
                @ {item.priceInfo?.storeName || 'no store'}
              </Text>

              {/* Added by / Modified by */}
              <Text style={styles.itemDetails}>
                Added by: {item.history?.[0]?.userId?.name || 'Unknown'}
              </Text>
              <Text style={styles.itemDetails}>
                Modified by: {item.lastModifiedBy?.name || 'Unknown'}
              </Text>

              {/* Status */}
              <Text style={styles.itemDetails}>
                Status: {item.status}
              </Text>

              {/* Controls: -, quantity, +, remove */}
              <View style={styles.controls}>
                {/* <TouchableOpacity style={styles.controlButton} onPress={()=>{handleUpdateItem(item?._id, item?.quantity - 1,item.status)}}>
                  <Text style={styles.controlText}>-</Text>
                </TouchableOpacity> */}
                <Text style={styles.quantityText}>Quantity:    {item.quantity}</Text>
                {/* <TouchableOpacity style={styles.controlButton} onPress={()=>{handleUpdateItem(item?._id, item?.quantity + 1,item.status)}}>
                  <Text style={styles.controlText}>+</Text>
                </TouchableOpacity> */}
                {/* {item.status === 'purchased'?
                    <TouchableOpacity style={styles.returnButtonIcon} onPress={()=>handleReturnItem(item?._id)}>
                      <Text style={styles.returnButtonText}>Return</Text>
                    </TouchableOpacity>
                    :
                    <TouchableOpacity style={styles.purchaseButtonIcon} onPress={()=>handlePurchaseItem(item?._id)}>
                      <Text style={styles.purchaseButtonText}>purchase</Text>
                    </TouchableOpacity>
                } */}
              </View>
            </View>
          </View>
        )}
      />
      {filterQuery == 'Pending' && filteredItems?.length > 0 && (
        <TouchableOpacity onPress={()=> handlePurchaseAllItems()} style={{position:'absolute',bottom:16,right:16, borderRadius:12, padding:16,backgroundColor:Colors.light.primary}}>
          <Text style={{fontWeight:'bold',color:Colors.light.secondary}}>Purchase All</Text>
        </TouchableOpacity>
      )}
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
    backgroundColor: Colors.light.white,
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
  purchaseButtonIcon: {
    padding: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 6,
    marginLeft: 8,
    marginTop: 4,
  },
  returnButtonIcon: {
    padding: 6,
    backgroundColor: Colors.light.secondary,
    borderRadius: 6,
    marginLeft: 8,
    marginTop: 4,
  },
  purchaseButtonText: {
    color: Colors.light.secondary,
    fontWeight: 'bold',
    fontSize: 20,
  },
  returnButtonText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  secondaryButtonIcon: {
    padding: 12,
    backgroundColor: Colors.light.secondary,
    borderRadius: 6,
    marginLeft: 8,
    marginTop: 4
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
    fontSize: 20,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: Colors.light.white,
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
  filterButtonIcon: {
    backgroundColor: Colors.light.secondary,
    padding: 6,
    borderRadius: 6,
    marginHorizontal: 2,
    color: Colors.light.primary
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
  centeredPage:{
    flex: 1,
    justifyContent: "center",
    textAlign: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.light.base,
  },
  storeContainer:{
    marginVertical: 10,
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    borderColor: Colors.light.secondary
  },
});