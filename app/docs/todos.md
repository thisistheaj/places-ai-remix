# Player Movement Synchronization Plan

## 1. Extend Firebase Functions (firebase.ts)
- [ ] Add `subscribeToPlayers` function to listen for all player updates
  ```typescript
  export const subscribeToPlayers = (callback: (players: PlayerMap) => void) => {
    const playersRef = ref(database, 'players');
    return onValue(playersRef, (snapshot) => {
      const players = snapshot.val() as PlayerMap;
      callback(players);
    });
  };
  ```

## 2. Extend User Functions (user.ts)
- [ ] Add `updatePlayerPosition` function (reusing existing ref pattern)
  ```typescript
  export const updatePlayerPosition = async (
    uid: string,
    gridPos: { x: number, y: number },
    facing: Direction,
    isMoving: boolean
  ) => {
    const playerRef = ref(database, `players/${uid}`);
    return update(playerRef, { 
      x: gridPos.x,
      y: gridPos.y,
      direction: facing,
      moving: isMoving
    });
  };
  ```

## 3. Update Game Scene (Game.ts)
- [ ] Add other players container to track remote players
- [ ] Subscribe to player updates in create()
- [ ] Call updatePlayerPosition when local player moves in tryMove()
- [ ] Handle other players joining/moving/disconnecting

### Implementation Flow
1. When player moves (in tryMove):
   ```typescript
   if (moveSuccessful) {
     await updatePlayerPosition(uid, this.gridPos, this.facing, true);
   }
   ```

2. When receiving updates (in create):
   ```typescript
   subscribeToPlayers((players) => {
     Object.entries(players).forEach(([uid, player]) => {
       if (uid !== currentUser.uid) {
         updateRemotePlayer(uid, player);
       }
     });
   });
   ```

### Next Steps
1. Add Firebase subscription function
2. Add position update function
3. Modify Game scene to handle remote players
4. Test with multiple browser windows