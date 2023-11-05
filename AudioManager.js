/* 
    AudioManager.js

    A container class used to automaically & dynamically manage audio resources in a
    queue-based interface.

    NOTE: A work-around is being used that requires the use of fs.createReadStream.
            This work-around fixes the player from not transitioing properly when 
            switching between playing backing local files and buffers/streams.

            This issue has not been fixed yet internally within @discordjs/voice.
            Remove this work-around in the future when possible.
*/

/*
    TODO:
        + implement skipping ✅
        + implement queue removing
        + implement announcements enabled toggle
        + implement currently playing cmd
        + set status to bot to `Playing tracks as a DJ`
        + implement ability to play discord hosted mp3s. also using direct links

        # long-term goals:
            + control panel
            + soundboard panel
            + can change things like volume, announcements, etc.
*/

const fs = require(`node:fs`)
const events = require(`events`);

const {
    AudioPlayerStatus,
    createAudioResource,
    createAudioPlayer,
    NoSubscriberBehavior,
    AudioResource
} = require(`@discordjs/voice`)

const DEFAULT_VOLUME = 0.3

function newTrack(resource, info) {
    const timeStamp = new Date() // TODO: Reformat to swap date and time location in string
    return {
        resource: resource,
        name: info.name,
        length: info.length,
        source: info.source,
        user: info.user,
        addTime: timeStamp.toLocaleString()
    }
}

class AudioManager {
    constructor() {
        this.queue = []
        this.currentTrack = null
        this.currentTrackStartTime = null

        this.volume = DEFAULT_VOLUME
        this.playing = false
        
        this.stateChanged = new events.EventEmitter()
        
        const player = createAudioPlayer({behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        }}) 
        player.on(`error`, error => {
            console.warn(`⚠🔊 discord.js AudioPlayer encountered an error: ${error}`)
            this.pause()
        })

        this.player = player
    }
    getQueue() {
        return this.queue
    }
    getPlayer() {
        return this.player
    }
    getIsPlaying() {
        return this.playing
    }
    getCurrentTrack() {
        return this.currentTrack
    }
    getCurrentTrackStartTime() {
        return this.currentTrackStartTime
    }

    /**
     * Gets the current track`s playback time in milliseconds
     * @return [Number] Gets (this.currentTrackStartTime - now) in milliseconds
     */
    getCurrentTrackPlayingTime() {
        return performance.now() - this.getCurrentTrackStartTime()
    }

    queueTrack(resourceLink, resourceInfo, insertionIndex) {
        // if starting up then play built-in intro start-up track

        // insert track at given index, else at end
        //console.log(`insertionIndex: ${insertionIndex}` || `insertionIndex was not given; going to end ${this.getQueue().length}`)
        insertionIndex = (insertionIndex != null) ? insertionIndex : this.getQueue().length
        //console.log(`insertionIndex2: ${insertionIndex}`)
        //console.log(`front queue pos: ${insertionIndex + 1}`)

        try {
            const newResource = createAudioResource(resourceLink, { inlineVolume: true })
            newResource.volume.setVolume(this.volume)
            
            this.queue.splice(insertionIndex, 0, newTrack(newResource, resourceInfo))
            console.log(`🔗🔊 Added to queue: '${resourceInfo.name}' at index ${insertionIndex}`)

            if (!this.playing) {
                console.log(`🟩🔊 First track added; starting up the queue`)
                this.playNext()
            }

            return true
        } catch(error) {
            console.warn(`⚠🔊 Encountered an error whilst trying to add track: ${error}`)
            this.pause()
            this.player.play(createAudioResource(fs.createReadStream(errorEventResource)))
            return false
        }
    }
    setVolume(newVolume) {
        console.log(`📊🔊 Changing volume from ${this.volume} to ${newVolume}`)
        this.volume = newVolume
        if (!this.getCurrentTrack()) { return }
        this.currentTrack.resource.volume.setVolume(newVolume)
        const currentQueue = this.getQueue()
        for (let i = 0; i < currentQueue.length; i++) {
            currentQueue[i].resource.volume.setVolume(newVolume)
        }
    }
    
    // TODO: Implement the following:
    //  1. skip to index in queue
    //  2. skip given range of tracks in queue (could be remove function)
    //  3. forceSkip
    skip(toIndex) {
        if (toIndex) {

        } else {
            this.player.stop()
        }
    }
    pause() {
        if (!this.getCurrentTrack()) { return false }
        this.player.pause(true)
        this.playing = false
    }
    resume() {
        if (!this.getCurrentTrack()) { return false }
        this.player.unpause()
        this.playing = true
    }

    forcePlay(resourceLink, skipCurrent) {
        if (!skipCurrent) {
            this.queueTrack(this.getCurrentTrack(), 0)
        }
        this.queueTrack(resourceLink, 0)
        this.player.stop()
        //this.playNext()
    }

    playNext() {
        const nextTrack = this.queue.shift()
        if (!nextTrack) {
            console.log(`🛑🔊 The queue is now empty; stopping`)
            this.currentTrack = null
            this.playing = false

            this.stateChanged.emit(`stopping`)
            return
        }

        console.log(`➡🔊 Now playing: '${nextTrack.name}'`)
        nextTrack.resource.volume.setVolume(this.volume)

        this.stateChanged.emit(`playing`)
        this.playing = true
        this.player.play(nextTrack.resource)
        this.player.once(AudioPlayerStatus.Idle, () => this.playNext())

        this.currentTrackStartTime = performance.now()
        this.currentTrack = nextTrack
    }
}

module.exports = AudioManager
    // actually implement functionality of insertionIndex 
    // (used to insert tracks at specific spots of queue)
    
    /**
     * Adds given resource with its supplemental info to queue at an optional index.
     * @param {AudioResource} resourceLink Link of resource to add. Internally uses createResource.
     * @param {Object} resourceInfo Required metainfo about resource.
     * @param {string} resourceInfo.name The title of the resource.
     * @param {string} resourceInfo.length [optional] The length in seconds of the resource.
     * @param {string} resourceInfo.source [optional] The origin of the resource.
     * @param {string} resourceInfo.user [optional] The string name of user adding the resource.
     * @param {Number} insertionIndex [optional] The location in the queue to insert the resource. Defaults to the end of the queue.
     * @return {boolean} Boolean response whether successful.
     */