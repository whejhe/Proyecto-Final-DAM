import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

const HomeScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to the Home Screen!</Text>
            <Pressable
                onPress={() => navigation.navigate('Details')}
                style={{ padding: 10, backgroundColor: '#f8f8f8' }}
            >
                <Text>Go to the Details Screen</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});

export default HomeScreen;