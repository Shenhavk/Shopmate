import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Colors from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import useFetch from '@/hooks/useFetch.hook';
import { API_URL, IP_ADDR } from '@/constants/config';
import { router } from 'expo-router';
import { postData  } from '@/constants/apiInstance.js';
import { useAuth } from '@/contexts/AuthContext';

function Recommend() {
  let { data, loading, error, refetch } = useFetch(`${API_URL}/api/users/me`);
  const [refreshing, setRefreshing] = useState(false);
  const [predictedItems, setPredictedItems] = useState([]);
  const { token } = useAuth();

  const onRefresh = () => {
    setRefreshing(true);
    if(predictedItems?.length > 0){
      handleRecommendList()
    }else{
      setTimeout(() => {
        setRefreshing(false);
      }, 2000)
    }
  };
  // useEffect(()=>{
  //   handleRecommendList()
  // },[refreshing])
  
  const householdId = data?.user?.householdId?._id;
  const handleRecommendList = async()=>{
    setRefreshing(true);
    console.log('Recommend me a list');
    console.log('householdId:', householdId);
    try {
      if(!householdId) return;
      const API_ENDPOINT = `http://${IP_ADDR}:5000/api/prediction/${householdId}`;  
      const options = {
          method: 'POST',
          headers:{
            "Content-Type":'application/json'
          }
      };
      console.log(`${API_ENDPOINT}`)
      const response = await fetch(API_ENDPOINT, options);
      console.log('Recommend me a list response', response);
      
      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }

      const pred_data = await response.json();
      console.log('itemPredictions',pred_data ?? []);
      setPredictedItems(pred_data)
    } catch (error) {
      console.log(error)
    }finally{
      setRefreshing(false);
    }
  };

  const acceptRecommendation=async()=>{
    if (!predictedItems) return Alert.alert("We could not create your recommended your list", "Try again");;
    console.log('I was hit')
    const result = await postData(`${API_URL}/api/households/recommend/list`,{recommendedItems: predictedItems},token);
    console.log(result)
    if(result.status){
      router.push(`/(modals)/list?listId=${result?.result?._id}`);
    }else{
      console.log(result?.result?.error);
      Alert.alert("We could not create your recommended your list", "Try again");
    };
  }

  if(!householdId || predictedItems?.length == 0) {
      return(
        <SafeAreaView style={styles.centeredPage}>
          {refreshing? (
            <View>
              <ActivityIndicator/>
              <Text>Fetching recommendation list</Text>
            </View>
          ): 
            <View style={{textAlign:'center',width:300,fontSize:26}}>
              <Text style={{textAlign:'center',width:300,fontSize:26}}>Use our intuitive recommendation model to know what to buy next in your list.</Text>
              <TouchableOpacity style={styles.secondaryButtonIcon} onPress={()=>{handleRecommendList()}}>
                <Text style={styles.secondaryButtonText}>Let us recommend you a list!</Text>
              </TouchableOpacity>
            </View>
          }
        </SafeAreaView>
      )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.title}>Recommending a list!</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.filterButtonIcon} onPress={()=>{acceptRecommendation()}}>
            <Text style={styles.removeButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={predictedItems}
        keyExtractor={(item, index) => index}
        contentContainerStyle={styles.itemsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['grey']}
            progressBackgroundColor={'black'}
          />
        }
        renderItem={({ item, index }) => (
          <View style={styles.itemCard} key={index}>            
            <View style={styles.row}>
              <Text style={styles.itemName}>
                {item[0]}
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

export default Recommend;

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
    marginTop:16,
    paddingVertical: 12
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
    padding: 6,
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
    fontSize: 12,
  },
  returnButtonText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  secondaryButtonIcon: {
    padding: 16,
    backgroundColor: Colors.light.secondary,
    borderRadius: 6,
    marginLeft: 8,
    marginTop: 4,
    textAlign: 'center',
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
    fontSize: 12,
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
  centeredPage:{
    flex: 1,
    justifyContent: "center",
    textAlign: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.light.base,
  },
});