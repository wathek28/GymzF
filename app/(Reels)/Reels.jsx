import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Animated,
  AppState
} from 'react-native';
import { MaterialIcons, Ionicons, AntDesign } from '@expo/vector-icons';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screen dimensions
const { width, height } = Dimensions.get('window');

// API Configuration 
const API_BASE_URL = 'http://192.168.0.3:8082';

const ReelsScreen = () => {
  // State management
  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoFiles, setVideoFiles] = useState({});
  const [pausedVideos, setPausedVideos] = useState({});
  const [likedReels, setLikedReels] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [appInBackground, setAppInBackground] = useState(false);
  
  // Animation for like effect
  const likeAnimation = useRef({});
  
  // Refs for video and flatlist management
  const videoRefs = useRef({});
  const flatListRef = useRef(null);
  const isScreenMounted = useRef(true);
  
  // Navigation parameters and hooks
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { userId, firstName, phoneNumber, photo } = params;

  // Fonction pour arrêter toutes les vidéos
  const stopAllVideos = async () => {
    if (!isScreenMounted.current) return;
    
    console.log('Stopping all videos');
    
    // Pause et décharge toutes les vidéos
    const videoPromises = Object.entries(videoRefs.current).map(async ([id, ref]) => {
      if (ref) {
        try {
          // Vérifier si la vidéo est chargée avant d'essayer de la mettre en pause
          const status = await ref.getStatusAsync().catch(() => null);
          if (status && status.isLoaded) {
            await ref.pauseAsync().catch(() => {});
            // Décharger la vidéo pour libérer les ressources
            await ref.unloadAsync().catch(() => {});
          }
        } catch (e) {
          console.log(`Error stopping video ${id}:`, e);
        }
      }
    });
    
    // Attendre que toutes les vidéos soient arrêtées
    await Promise.all(videoPromises).catch(() => {});
    
    // Marquer toutes les vidéos comme en pause
    if (isScreenMounted.current) {
      const allPaused = {};
      reels.forEach((_, index) => {
        allPaused[index] = true;
      });
      setPausedVideos(allPaused);
    }
  };

  // Save user data to local storage
  const saveUserDataToStorage = async () => {
    if (userId && !(await AsyncStorage.getItem('userId'))) {
      try {
        await AsyncStorage.setItem('userId', userId);
        if (firstName) await AsyncStorage.setItem('firstName', firstName);
        if (phoneNumber) await AsyncStorage.setItem('phoneNumber', phoneNumber);
        if (photo) await AsyncStorage.setItem('userPhoto', photo);
        console.log('User data saved to AsyncStorage');
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    }
  };

  // Load liked reels from AsyncStorage
  const loadLikedReels = async () => {
    try {
      const savedLikedReels = await AsyncStorage.getItem('likedReels');
      if (savedLikedReels) {
        setLikedReels(JSON.parse(savedLikedReels));
      }
      
      // Charger les statistiques de likes pour débug
      const detailedLikesStr = await AsyncStorage.getItem('detailedLikes');
      if (detailedLikesStr) {
        const detailedLikes = JSON.parse(detailedLikesStr);
        console.log(`Loaded ${Object.keys(detailedLikes).length} detailed likes`);
      }
    } catch (error) {
      console.error('Error loading liked reels:', error);
    }
  };

  // Function to handle likes
  const handleLike = async (reelId) => {
    // Créer une copie de l'état actuel des likes
    const newLikedReels = { ...likedReels };
    const isLiked = !newLikedReels[reelId];
    
    // Mettre à jour l'état local
    newLikedReels[reelId] = isLiked;
    setLikedReels(newLikedReels);
    
    // Mettre à jour le compteur de likes
    setLikeCounts(prev => ({
      ...prev,
      [reelId]: isLiked ? (prev[reelId] || 0) + 1 : Math.max(0, (prev[reelId] || 0) - 1)
    }));
    
    // Animer le cœur
    if (isLiked && likeAnimation.current[reelId]) {
      Animated.sequence([
        Animated.timing(likeAnimation.current[reelId], {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(likeAnimation.current[reelId], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
    
    // Structure de données améliorée pour les likes
    const timestamp = new Date().toISOString();
    
    try {
      // Récupérer la liste détaillée des likes
      const detailedLikesStr = await AsyncStorage.getItem('detailedLikes');
      let detailedLikes = detailedLikesStr ? JSON.parse(detailedLikesStr) : {};
      
      // Mettre à jour avec plus d'informations
      detailedLikes[reelId] = {
        status: isLiked,
        timestamp,
        reelId
      };
      
      // Enregistrer les deux formats (simple et détaillé)
      await AsyncStorage.setItem('likedReels', JSON.stringify(newLikedReels));
      await AsyncStorage.setItem('detailedLikes', JSON.stringify(detailedLikes));
      
      // Enregistrer l'historique des actions de like/unlike
      const likeHistoryStr = await AsyncStorage.getItem('likeHistory');
      const likeHistory = likeHistoryStr ? JSON.parse(likeHistoryStr) : [];
      
      // Ajouter à l'historique (limité à 100 entrées pour éviter de surcharger le stockage)
      likeHistory.unshift({
        reelId,
        action: isLiked ? 'like' : 'unlike',
        timestamp
      });
      
      // Limiter la taille de l'historique
      if (likeHistory.length > 100) {
        likeHistory.length = 100;
      }
      
      await AsyncStorage.setItem('likeHistory', JSON.stringify(likeHistory));
      
      console.log(`Reel ${reelId} ${isLiked ? 'liked' : 'unliked'} saved locally with timestamp ${timestamp}`);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des likes:', error);
    }
  };

  // Double-tap for like
  const lastTap = useRef({});
  const handleDoubleTap = (reelId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap.current[reelId] && (now - lastTap.current[reelId]) < DOUBLE_TAP_DELAY) {
      if (!likedReels[reelId]) {
        handleLike(reelId);
      }
      lastTap.current[reelId] = 0;
    } else {
      lastTap.current[reelId] = now;
    }
  };

  // Gestionnaire complet d'état de l'application
  useEffect(() => {
    isScreenMounted.current = true;
    
    // Gérer les changements d'état de l'application
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      console.log('App state changed to:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setAppInBackground(true);
        console.log('App going to background, stopping all videos immediately');
        stopAllVideos();
      } else if (nextAppState === 'active' && appInBackground) {
        setAppInBackground(false);
        console.log('App is active again');
        // Ne pas redémarrer automatiquement les vidéos
      }
    });
    
    // Écouter les événements de navigation
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('Screen focused');
      setAppInBackground(false);
      // Ne pas redémarrer automatiquement les vidéos
    });
    
    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log('Screen lost focus, stopping all videos');
      setAppInBackground(true);
      stopAllVideos();
    });
    
    // Écouter les événements du router expo
    const routerFocus = router?.addListener?.('focus', () => {
      console.log('Router focus event');
      setAppInBackground(false);
    });
    
    const routerBlur = router?.addListener?.('blur', () => {
      console.log('Router blur event');
      setAppInBackground(true);
      stopAllVideos();
    });
    
    return () => {
      console.log('Cleaning up app state and navigation listeners');
      isScreenMounted.current = false;
      
      appStateSubscription.remove();
      unsubscribeFocus();
      unsubscribeBlur();
      
      if (routerFocus) routerFocus();
      if (routerBlur) routerBlur();
      
      // Arrêter toutes les vidéos
      stopAllVideos();
    };
  }, [reels]);

  // Log received parameters and save to storage
  useEffect(() => {
    console.log("Parameters received in ReelsScreen:", { 
      userId, 
      firstName, 
      phoneNumber, 
      photoAvailable: photo ? "yes" : "no" 
    });
    
    saveUserDataToStorage();
    loadLikedReels();
  }, [userId, firstName, phoneNumber, photo]);

  // Navigation back handler
  const handleGoBack = () => {
    // S'assurer que toutes les vidéos sont arrêtées avant de quitter l'écran
    stopAllVideos().then(() => {
      router.back();
    });
  };

  // Toggle play/pause for videos
  const togglePlayPause = async (index) => {
    if (appInBackground) return;
    
    const ref = videoRefs.current[index.toString()];
    if (!ref) return;
    
    try {
      const status = await ref.getStatusAsync();
      if (status.isPlaying) {
        await ref.pauseAsync();
        setPausedVideos(prev => ({ ...prev, [index]: true }));
      } else {
        await ref.playAsync();
        setPausedVideos(prev => ({ ...prev, [index]: false }));
      }
    } catch (e) {
      console.error('Error changing playback state:', e);
    }
  };

  // Create local video file from base64 data
  const createVideoFile = async (videoData, reelId) => {
    try {
      if (!videoData) {
        console.log(`No video data for reel ${reelId}`);
        return null;
      }
      
      const filename = `${FileSystem.cacheDirectory}temp_video_${reelId}_${Date.now()}.mp4`;
      
      console.log(`Creating video file for reel ${reelId} at ${filename}`);
      
      await FileSystem.writeAsStringAsync(filename, videoData, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      console.log(`Video file created successfully for reel ${reelId}`);
      return filename;
    } catch (error) {
      console.error(`Error creating video file for reel ${reelId}:`, error);
      return null;
    }
  };

  // Fetch reels from API
  const fetchReels = async () => {
    try {
      console.log('Fetching reels from API...');
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/reels/all`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Retrieved ${data.length} reels`);
      
      // Create local video files
      const videoFilesMap = {};
      for (const reel of data) {
        if (reel.videoData) {
          const videoPath = await createVideoFile(reel.videoData, reel.id);
          if (videoPath) {
            videoFilesMap[reel.id] = videoPath;
          }
        }
      }
      
      if (Object.keys(videoFilesMap).length > 0) {
        console.log(`${Object.keys(videoFilesMap).length} video files created locally`);
        setVideoFiles(videoFilesMap);
      }
      
      // Initialize like animations for each reel
      data.forEach(reel => {
        if (!likeAnimation.current[reel.id]) {
          likeAnimation.current[reel.id] = new Animated.Value(1);
        }
        
        // Initialize like counts
        setLikeCounts(prev => ({
          ...prev,
          [reel.id]: reel.likesCount || 0
        }));
      });
      
      // Process reels
      const processedReels = data.map((reel) => {
        // Use local video file or server URL
        const videoUri = videoFilesMap[reel.id] 
          ? videoFilesMap[reel.id] 
          : `${API_BASE_URL}/api/reels/video/${reel.id}`;
        
        return {
          id: reel.id,
          videoUri,
          title: reel.title || 'Untitled',
          description: reel.description || '',
          likesCount: reel.likesCount || 0,
          isLiked: likedReels[reel.id] || false, // Use local liked state
          user: {
            name: reel.author?.firstName || 'User',
            profilePic: reel.author?.photo 
              ? `data:image/jpeg;base64,${reel.author.photo}` 
              : null
          }
        };
      });
      
      if (isScreenMounted.current) {
        setReels(processedReels);
        console.log(`${processedReels.length} reels processed successfully`);
      }
      
    } catch (error) {
      console.error('Error fetching reels:', error);
      if (isScreenMounted.current) {
        setError(error.message);
      }
    } finally {
      if (isScreenMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Fetch reels on component mount
  useEffect(() => {
    fetchReels();
    
    // Cleanup on unmount
    return () => {
      console.log('Component unmounting, cleaning up all resources');
      isScreenMounted.current = false;
      
      // Unload all videos
      Object.values(videoRefs.current).forEach(videoRef => {
        if (videoRef) {
          videoRef.pauseAsync()
            .then(() => videoRef.unloadAsync())
            .catch(() => {});
        }
      });
      
      // Remove temporary video files
      Object.values(videoFiles).forEach(filePath => {
        if (filePath && filePath.startsWith(FileSystem.cacheDirectory)) {
          FileSystem.deleteAsync(filePath, { idempotent: true }).catch(() => {});
        }
      });
    };
  }, []);

  // Manage video playback on index change
  useEffect(() => {
    if (reels.length === 0 || appInBackground) return;
    
    const playCurrentVideo = async () => {
      // Pause all videos
      for (const [id, ref] of Object.entries(videoRefs.current)) {
        if (ref && id !== currentIndex.toString()) {
          try {
            const status = await ref.getStatusAsync().catch(() => null);
            if (status && status.isLoaded) {
              await ref.pauseAsync().catch(() => {});
              // Unload distant videos to save memory
              if (Math.abs(parseInt(id) - currentIndex) > 1) {
                await ref.unloadAsync().catch(() => {});
              }
            }
          } catch (e) {
            console.log(`Error pausing video ${id}:`, e);
          }
        }
      }
      
      // Play current video only if app is in foreground
      if (!appInBackground) {
        const currentRef = videoRefs.current[currentIndex.toString()];
        if (currentRef && !pausedVideos[currentIndex]) {
          try {
            const status = await currentRef.getStatusAsync().catch(() => ({ isLoaded: false }));
            if (!status.isLoaded) {
              await currentRef.loadAsync({ uri: reels[currentIndex].videoUri }).catch(() => {});
              // Double-check app state after loading (might have changed during load)
              if (appInBackground) {
                await currentRef.pauseAsync().catch(() => {});
                return;
              }
            }
            if (status.isLoaded && !status.isPlaying && !appInBackground) {
              await currentRef.playAsync().catch(() => {});
            }
          } catch (e) {
            console.log(`Error playing video ${currentIndex}:`, e);
          }
        }
      }
    };
    
    if (isScreenMounted.current) {
      playCurrentVideo();
      
      // Reset pause state on index change if app is in foreground
      if (!appInBackground) {
        setPausedVideos(prev => ({ ...prev, [currentIndex]: false }));
      }
    }
  }, [currentIndex, reels, appInBackground]);

  // Render individual reel
  const renderReel = ({ item, index }) => {
    const shouldRenderFullContent = Math.abs(index - currentIndex) <= 1;
    const isPaused = pausedVideos[index] || false;
    const isLiked = likedReels[item.id] || false;
    
    // Animation scale for like button
    const likeScale = likeAnimation.current[item.id] || new Animated.Value(1);
    
    return (
      <View style={styles.reelContainer}>
        {/* Video Background */}
        <Video
          ref={ref => { videoRefs.current[index.toString()] = ref; }}
          source={{ uri: item.videoUri }}
          style={styles.videoBackground}
          resizeMode="contain"
          shouldPlay={index === currentIndex && !isPaused && !appInBackground}
          isLooping
          volume={1.0}
          isMuted={false}
          useNativeControls={false}
          onError={(error) => {
            console.error(`Video playback error for reel ${item.id}:`, error);
          }}
          onPlaybackStatusUpdate={(status) => {
            if (appInBackground && status.isPlaying) {
              // Si l'application est en arrière-plan mais que la vidéo joue toujours, la mettre en pause
              videoRefs.current[index.toString()]?.pauseAsync().catch(() => {});
            } else if (status.isLoaded && index === currentIndex && !status.isPlaying && !isPaused && !appInBackground) {
              videoRefs.current[index.toString()]?.playAsync().catch(() => {});
            }
          }}
        />
        
        {/* Video Overlay */}
        <View style={styles.overlay} />
        
        {/* Double Tap Area for Like */}
        <TouchableOpacity 
          style={styles.doubleTapArea}
          activeOpacity={1}
          onPress={() => handleDoubleTap(item.id)}
        />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        
        {/* Like Button */}
        <View style={styles.interactionButtons}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLike(item.id)}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <AntDesign 
                name={isLiked ? "heart" : "hearto"} 
                size={28} 
                color={isLiked ? "#CBFF06" : "white"} 
              />
            </Animated.View>
            <Text style={styles.likeCount}>
              {likeCounts[item.id] || 0}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Play/Pause Button */}
        <TouchableOpacity 
          style={styles.playPauseContainer}
          onPress={() => togglePlayPause(index)}
        >
          {isPaused && (
            <View style={styles.playButton}>
              <MaterialIcons name="play-arrow" size={50} color="#CBFF06" />
            </View>
          )}
        </TouchableOpacity>
        
        {/* Unified Creator and Description Card */}
        {shouldRenderFullContent && (
          <View style={styles.unifiedCard}>
            <View style={styles.cardHeader}>
              <Image
                source={
                  item.user.profilePic 
                    ? { uri: item.user.profilePic } 
                    : require('../../assets/images/b.png')
                }
                style={styles.creatorProfilePic}
              />
              <Text style={styles.creatorName}>{item.user.name}</Text>
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.reelDescription}>{item.description}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#CBFF06" />
        <Text style={styles.loaderText}>Loading reels...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchReels}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // No content state
  if (reels.length === 0) {
    return (
      <View style={styles.noContentContainer}>
        <Text style={styles.noContentText}>No reels available</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchReels}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Vertical FlatList for reels */}
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
        initialNumToRender={1}
        contentContainerStyle={{ flexGrow: 1 }}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / height);
          setCurrentIndex(index);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    margin: 0,
    padding: 0,
    paddingTop: 0,
  },
  reelContainer: {
    width: '100%',
    height: height,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  videoBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  doubleTapArea: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    top: '15%',
    left: '15%',
    zIndex: 4,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  interactionButtons: {
    position: 'absolute',
    right: 20,
    bottom: 180,
    alignItems: 'center',
    zIndex: 10,
  },
  likeButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  likeCount: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  playPauseContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unifiedCard: {
    position: 'absolute',
    left: 20,
    bottom: 100,
    width: 300,
    backgroundColor: 'rgba(12, 12, 12, 0.4)',
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  creatorProfilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
    marginRight: 15,
  },
  creatorName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardContent: {
    
  },
  reelTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  reelDescription: {
    color: 'white',
    fontSize: 16,
    opacity: 0.95,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loaderText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 18,
  },
  retryButton: {
    backgroundColor: '#CBFF06',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  noContentText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#CBFF06',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ReelsScreen;