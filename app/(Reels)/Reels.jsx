import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.0.3:8082';

const ReelsScreen = () => {
  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoFiles, setVideoFiles] = useState({});
  const [pausedVideos, setPausedVideos] = useState({});
  
  // Référence pour accéder aux composants vidéo
  const videoRefs = useRef({});
  const flatListRef = useRef(null);
  
  // Récupérer les paramètres de navigation
  const params = useLocalSearchParams();
  const { userId, firstName, phoneNumber } = params;

  // Fonction de retour
  const handleGoBack = () => {
    router.back();
  };

  // Fonction pour mettre en pause/reprendre la vidéo
  const togglePlayPause = async (index) => {
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
      console.error('Erreur lors du changement de l\'état de lecture:', e);
    }
  };

  // Fonction pour convertir les données blob en URI vidéo locale
  const createVideoFile = async (videoData, reelId) => {
    try {
      if (!videoData) {
        console.log(`Pas de données vidéo pour le reel ${reelId}`);
        return null;
      }
      
      // Créer un fichier temporaire pour la vidéo
      const filename = `${FileSystem.cacheDirectory}temp_video_${reelId}_${Date.now()}.mp4`;
      
      console.log(`Création du fichier vidéo pour le reel ${reelId} à ${filename}`);
      
      // Enregistrer les données base64 dans un fichier
      await FileSystem.writeAsStringAsync(filename, videoData, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      console.log(`Fichier vidéo créé avec succès pour le reel ${reelId}`);
      return filename;
    } catch (error) {
      console.error(`Erreur lors de la création du fichier vidéo pour le reel ${reelId}:`, error);
      return null;
    }
  };

  // Tester la validité de l'URL vidéo
  const testVideoUrl = async (url) => {
    try {
      console.log(`Vérification de l'URL vidéo: ${url}`);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'URL vidéo: ${url}`, error);
      return false;
    }
  };

  // Fonction pour récupérer les reels depuis l'API
  const fetchReels = async () => {
    try {
      console.log('Récupération des reels depuis l\'API...');
      setIsLoading(true);
      setError(null);
      
      // Récupérer la liste des reels
      const response = await fetch(`${API_BASE_URL}/api/reels/all`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Récupération de ${data.length} reels réussie`);
      
      // Créer des fichiers vidéo pour chaque reel si videoData est disponible
      const videoFilesMap = {};
      for (const reel of data) {
        if (reel.videoData) {
          console.log(`Traitement des données vidéo pour le reel ${reel.id}`);
          const videoPath = await createVideoFile(reel.videoData, reel.id);
          if (videoPath) {
            videoFilesMap[reel.id] = videoPath;
          }
        }
      }
      
      if (Object.keys(videoFilesMap).length > 0) {
        console.log(`${Object.keys(videoFilesMap).length} fichiers vidéo créés localement`);
        setVideoFiles(videoFilesMap);
      }
      
      // Traiter chaque reel
      const processedReels = await Promise.all(data.map(async (reel) => {
        // Essayer d'utiliser le fichier vidéo local si disponible
        let videoUri;
        
        if (videoFilesMap[reel.id]) {
          // Utiliser le fichier local si créé avec succès
          videoUri = videoFilesMap[reel.id];
          console.log(`Utilisation du fichier vidéo local pour le reel ${reel.id}: ${videoUri}`);
        } else {
          // Sinon, essayer d'utiliser l'URL du serveur
          videoUri = `${API_BASE_URL}/api/reels/video/${reel.id}`;
          
          // Vérifier si l'URL est valide
          const isValid = await testVideoUrl(videoUri);
          if (!isValid) {
            console.warn(`L'URL vidéo n'est pas valide pour le reel ${reel.id}: ${videoUri}`);
          } else {
            console.log(`URL vidéo valide pour le reel ${reel.id}: ${videoUri}`);
          }
        }
        
        // Créer l'URL de la vignette ou utiliser l'image par défaut
        let thumbnailUri;
        if (reel.thumbnail) {
          thumbnailUri = `data:image/jpeg;base64,${reel.thumbnail}`;
        } else {
          thumbnailUri = Image.resolveAssetSource(require('../../assets/images/b.png')).uri;
        }
        
        return {
          id: reel.id,
          videoUri,
          thumbnailUri,
          title: reel.title || 'Sans titre',
          description: reel.description || '',
          user: {
            name: reel.author?.firstName || 'Utilisateur',
            profilePic: reel.author?.photo ? `data:image/jpeg;base64,${reel.author.photo}` : null
          },
          likes: 0,
          isLiked: false
        };
      }));
      
      setReels(processedReels);
      console.log(`${processedReels.length} reels traités avec succès`);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des reels:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupération des reels au chargement
  useEffect(() => {
    fetchReels();
    
    // Nettoyage des références et fichiers temporaires lors du démontage
    return () => {
      // Arrêter et décharger toutes les vidéos
      Object.values(videoRefs.current).forEach(videoRef => {
        if (videoRef) videoRef.unloadAsync().catch(() => {});
      });
      
      // Supprimer les fichiers vidéo temporaires
      Object.values(videoFiles).forEach(filePath => {
        if (filePath && filePath.startsWith(FileSystem.cacheDirectory)) {
          FileSystem.deleteAsync(filePath, { idempotent: true }).catch(() => {});
        }
      });
    };
  }, []);

  // Gestion de la lecture des vidéos lors du changement d'index
  useEffect(() => {
    const playCurrentVideo = async () => {
      // Mettre en pause toutes les vidéos
      for (const [id, ref] of Object.entries(videoRefs.current)) {
        if (ref && id !== currentIndex.toString()) {
          try {
            await ref.pauseAsync();
            // Décharger les vidéos non visibles pour économiser de la mémoire
            if (Math.abs(parseInt(id) - currentIndex) > 1) {
              await ref.unloadAsync();
            }
          } catch (e) {
            console.log(`Erreur lors de la mise en pause de la vidéo ${id}:`, e);
          }
        }
      }
      
      // Lecture de la vidéo actuelle si elle n'est pas explicitement mise en pause
      const currentRef = videoRefs.current[currentIndex.toString()];
      if (currentRef && !pausedVideos[currentIndex]) {
        try {
          const status = await currentRef.getStatusAsync();
          if (!status.isLoaded) {
            await currentRef.loadAsync({ uri: reels[currentIndex].videoUri });
          }
          if (status.isLoaded && !status.isPlaying) {
            await currentRef.playAsync();
          }
        } catch (e) {
          console.log(`Erreur lors de la lecture de la vidéo ${currentIndex}:`, e);
        }
      }
    };
    
    playCurrentVideo();
    
    // Réinitialiser l'état de pause lors du changement d'index
    setPausedVideos(prev => ({ ...prev, [currentIndex]: false }));
  }, [currentIndex]);

  // Rendu d'un reel individuel
  const renderReel = ({ item, index }) => {
    // N'afficher que la vidéo courante et les vidéos adjacentes pour économiser des ressources
    const shouldRenderFullContent = Math.abs(index - currentIndex) <= 1;
    const isPaused = pausedVideos[index] || false;
    
    return (
      <View style={styles.reelContainer}>
        {/* Vidéo en arrière-plan */}
        <Video
          ref={ref => { videoRefs.current[index.toString()] = ref; }}
          source={{ uri: item.videoUri }}
          posterSource={{ uri: item.thumbnailUri }}
          usePoster={true}
          posterStyle={{ resizeMode: 'cover' }}
          style={styles.videoBackground}
          resizeMode="cover"
          shouldPlay={index === currentIndex && !isPaused}
          isLooping
          volume={1.0}
          isMuted={false}
          useNativeControls={false}
          onError={(error) => {
            console.error(`Erreur de lecture vidéo pour le reel ${item.id}:`, error);
          }}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && index === currentIndex && !status.isPlaying && !isPaused) {
              videoRefs.current[index.toString()].playAsync().catch(() => {});
            }
          }}
        />
        
        {/* Overlay pour assombrir légèrement la vidéo */}
        <View style={styles.overlay} />
        
        {/* Bouton de retour en haut à gauche */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        
        {/* Bouton central pour mettre en pause/reprendre la vidéo */}
        <TouchableOpacity 
          style={styles.playPauseContainer}
          onPress={() => togglePlayPause(index)}
        >
          {isPaused && (
            <View style={styles.playButton}>
              <MaterialIcons name="play-arrow" size={50} color="white" />
            </View>
          )}
        </TouchableOpacity>
        
        {/* Actions à droite - plus haut dans l'écran */}
        <View style={styles.rightActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => {
              const updatedReels = [...reels];
              updatedReels[index].isLiked = !updatedReels[index].isLiked;
              if (updatedReels[index].isLiked) {
                updatedReels[index].likes += 1;
              } else {
                updatedReels[index].likes -= 1;
              }
              setReels(updatedReels);
            }}
          >
            <FontAwesome 
              name="star" 
              size={24} 
              color={item.isLiked ? "#CCFF00" : "white"} 
            />
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>
          
          {/* Profil utilisateur - ne s'affiche que pour la vidéo courante pour améliorer les performances */}
          {shouldRenderFullContent && (
            <TouchableOpacity style={styles.profileAction}>
              <Image
                source={item.user.profilePic ? { uri: item.user.profilePic } : require('../../assets/images/b.png')}
                style={styles.profilePic}
              />
              <View style={styles.profileBadge}>
                <FontAwesome name="plus" size={10} color="white" />
              </View>
              <Text style={styles.profileActionText}>S'abonner</Text>
              <Text style={styles.profileActionSubtext}>@{item.user.name.toLowerCase()}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Description en bas - ne s'affiche que pour la vidéo courante pour améliorer les performances */}
        {shouldRenderFullContent && (
          <View style={styles.bottomContent}>
            <Text style={styles.reelTitle}>{item.title}</Text>
            <Text style={styles.reelDescription}>{item.description}</Text>
          </View>
        )}
      </View>
    );
  };

  // Gestion de l'affichage du chargement et des erreurs
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#CCFF00" />
        <Text style={styles.loaderText}>Chargement des reels...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchReels}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (reels.length === 0) {
    return (
      <SafeAreaView style={styles.noContentContainer}>
        <Text style={styles.noContentText}>Aucun reel disponible</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchReels}>
          <Text style={styles.refreshButtonText}>Rafraîchir</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      
      {/* FlatList verticale pour les reels */}
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
        maxToRenderPerBatch={3} // Limite le nombre d'éléments rendus par lot
        windowSize={5} // Définit la taille de la fenêtre de rendu (éléments avant et après l'élément visible)
        removeClippedSubviews={true} // Retire les vues qui ne sont pas visibles
        initialNumToRender={1} // Commence avec un seul élément rendu
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / height);
          setCurrentIndex(index);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  reelContainer: {
    width: width,
    height: height,
    backgroundColor: '#000',
  },
  videoBackground: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
  rightActions: {
    position: 'absolute',
    right: 20,
    bottom: 250, // Déplacé plus haut sur l'écran
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  profileAction: {
    alignItems: 'center',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  profileBadge: {
    position: 'absolute',
    bottom: 25,
    right: -2,
    backgroundColor: '#CCFF00',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  profileActionSubtext: {
    color: 'white',
    fontSize: 10,
    opacity: 0.8,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 70,
  },
  reelTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reelDescription: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
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
  },
  retryButton: {
    backgroundColor: '#CCFF00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'black',
    fontWeight: 'bold',
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
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#CCFF00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
});

export default ReelsScreen;