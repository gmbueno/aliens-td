// 1-4 · Broken Relay. Authored route, terrain and waves.
const level4 = {
  "id": "level_4",
  "name": "Broken Relay",
  "description": "Armored bulwarks resist small arms. Water tiles accept weapons after Pontoon Engineering (+$35 per raft).",
  "sector": 1,
  "stage": 4,
  "biome": "outpost",
  "rule": "Armor",
  "recommendedLevel": 4,
  "cols": 16,
  "rows": 9,
  "tileSize": 48,
  "startGold": 260,
  "lives": 18,
  "threat": 1.38,
  "clearXp": 45,
  "firstClearXp": 65,
  "blockers": [
    {
      "row": 0,
      "col": 0,
      "kind": "rock",
      "cost": 0
    },
    {
      "row": 8,
      "col": 0,
      "kind": "rock",
      "cost": 0
    },
    {
      "row": 0,
      "col": 15,
      "kind": "rock",
      "cost": 0
    },
    {
      "row": 8,
      "col": 15,
      "kind": "rock",
      "cost": 0
    },
    {
      "row": 0,
      "col": 10,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 2,
      "col": 12,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 3,
      "col": 10,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 5,
      "col": 12,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 3,
      "col": 3,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 5,
      "col": 5,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 6,
      "col": 3,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 8,
      "col": 5,
      "kind": "cargo",
      "cost": 50
    }
  ],
  "pads": [],
  "track": [
    {
      "col": 0,
      "row": 1
    },
    {
      "row": 1,
      "col": 1
    },
    {
      "row": 1,
      "col": 2
    },
    {
      "row": 1,
      "col": 3
    },
    {
      "row": 1,
      "col": 4
    },
    {
      "row": 1,
      "col": 5
    },
    {
      "row": 1,
      "col": 6
    },
    {
      "row": 1,
      "col": 7
    },
    {
      "row": 1,
      "col": 8
    },
    {
      "row": 1,
      "col": 9
    },
    {
      "row": 1,
      "col": 10
    },
    {
      "row": 1,
      "col": 11
    },
    {
      "row": 2,
      "col": 11
    },
    {
      "row": 3,
      "col": 11
    },
    {
      "row": 4,
      "col": 11
    },
    {
      "row": 4,
      "col": 10
    },
    {
      "row": 4,
      "col": 9
    },
    {
      "row": 4,
      "col": 8
    },
    {
      "row": 4,
      "col": 7
    },
    {
      "row": 4,
      "col": 6
    },
    {
      "row": 4,
      "col": 5
    },
    {
      "row": 4,
      "col": 4
    },
    {
      "row": 5,
      "col": 4
    },
    {
      "row": 6,
      "col": 4
    },
    {
      "row": 7,
      "col": 4
    },
    {
      "row": 7,
      "col": 5
    },
    {
      "row": 7,
      "col": 6
    },
    {
      "row": 7,
      "col": 7
    },
    {
      "row": 7,
      "col": 8
    },
    {
      "row": 7,
      "col": 9
    },
    {
      "row": 7,
      "col": 10
    },
    {
      "row": 7,
      "col": 11
    },
    {
      "row": 7,
      "col": 12
    },
    {
      "row": 7,
      "col": 13
    },
    {
      "row": 7,
      "col": 14
    },
    {
      "row": 7,
      "col": 15
    }
  ],
  "waves": [
    {
      "id": 1,
      "name": "Fast flank",
      "healthScale": 1,
      "reward": 43,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.3
        },
        {
          "enemy": "alien_fast",
          "at": 2.2
        },
        {
          "enemy": "alien_normal",
          "at": 3.1
        },
        {
          "enemy": "alien_normal",
          "at": 4
        },
        {
          "enemy": "alien_normal",
          "at": 4.9
        },
        {
          "enemy": "alien_fast",
          "at": 5.8
        },
        {
          "enemy": "alien_normal",
          "at": 6.7
        },
        {
          "enemy": "alien_normal",
          "at": 7.6
        },
        {
          "enemy": "alien_normal",
          "at": 8.5
        },
        {
          "enemy": "alien_fast",
          "at": 9.4
        }
      ]
    },
    {
      "id": 2,
      "name": "Fast flank",
      "healthScale": 1.1,
      "reward": 48,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.23
        },
        {
          "enemy": "alien_fast",
          "at": 2.07
        },
        {
          "enemy": "alien_normal",
          "at": 2.9
        },
        {
          "enemy": "alien_normal",
          "at": 3.74
        },
        {
          "enemy": "alien_normal",
          "at": 4.58
        },
        {
          "enemy": "alien_fast",
          "at": 5.41
        },
        {
          "enemy": "alien_normal",
          "at": 6.25
        },
        {
          "enemy": "alien_normal",
          "at": 7.08
        },
        {
          "enemy": "alien_normal",
          "at": 7.92
        },
        {
          "enemy": "alien_fast",
          "at": 8.75
        },
        {
          "enemy": "alien_normal",
          "at": 9.58
        },
        {
          "enemy": "alien_normal",
          "at": 10.42
        }
      ]
    },
    {
      "id": 3,
      "name": "Armored convoy",
      "healthScale": 1.2,
      "reward": 53,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.17
        },
        {
          "enemy": "alien_fast",
          "at": 1.94
        },
        {
          "enemy": "alien_normal",
          "at": 2.71
        },
        {
          "enemy": "alien_normal",
          "at": 3.48
        },
        {
          "enemy": "alien_tank",
          "at": 4.25
        },
        {
          "enemy": "alien_fast",
          "at": 5.02
        },
        {
          "enemy": "alien_normal",
          "at": 5.79
        },
        {
          "enemy": "alien_normal",
          "at": 6.56
        },
        {
          "enemy": "alien_normal",
          "at": 7.33
        },
        {
          "enemy": "alien_fast",
          "at": 8.1
        },
        {
          "enemy": "alien_normal",
          "at": 8.87
        },
        {
          "enemy": "alien_tank",
          "at": 9.64
        },
        {
          "enemy": "alien_normal",
          "at": 10.41
        },
        {
          "enemy": "alien_fast",
          "at": 11.18
        }
      ]
    },
    {
      "id": 4,
      "name": "Armored convoy",
      "healthScale": 1.3,
      "reward": 58,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.1
        },
        {
          "enemy": "alien_fast",
          "at": 1.81
        },
        {
          "enemy": "alien_normal",
          "at": 2.51
        },
        {
          "enemy": "alien_normal",
          "at": 3.22
        },
        {
          "enemy": "alien_tank",
          "at": 3.92
        },
        {
          "enemy": "alien_fast",
          "at": 4.63
        },
        {
          "enemy": "alien_normal",
          "at": 5.33
        },
        {
          "enemy": "alien_normal",
          "at": 6.04
        },
        {
          "enemy": "alien_normal",
          "at": 6.74
        },
        {
          "enemy": "alien_fast",
          "at": 7.45
        },
        {
          "enemy": "alien_normal",
          "at": 8.15
        },
        {
          "enemy": "alien_tank",
          "at": 8.86
        },
        {
          "enemy": "alien_normal",
          "at": 9.56
        },
        {
          "enemy": "alien_fast",
          "at": 10.27
        },
        {
          "enemy": "alien_normal",
          "at": 10.97
        },
        {
          "enemy": "alien_normal",
          "at": 11.68
        }
      ]
    },
    {
      "id": 5,
      "name": "Armored convoy",
      "healthScale": 1.4,
      "reward": 63,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.04
        },
        {
          "enemy": "alien_fast",
          "at": 1.68
        },
        {
          "enemy": "alien_normal",
          "at": 2.32
        },
        {
          "enemy": "alien_normal",
          "at": 2.96
        },
        {
          "enemy": "alien_tank",
          "at": 3.6
        },
        {
          "enemy": "alien_fast",
          "at": 4.24
        },
        {
          "enemy": "alien_normal",
          "at": 4.88
        },
        {
          "enemy": "alien_normal",
          "at": 5.52
        },
        {
          "enemy": "alien_normal",
          "at": 6.16
        },
        {
          "enemy": "alien_fast",
          "at": 6.8
        },
        {
          "enemy": "alien_normal",
          "at": 7.44
        },
        {
          "enemy": "alien_tank",
          "at": 8.08
        },
        {
          "enemy": "alien_normal",
          "at": 8.72
        },
        {
          "enemy": "alien_fast",
          "at": 9.36
        },
        {
          "enemy": "alien_normal",
          "at": 10
        },
        {
          "enemy": "alien_normal",
          "at": 10.64
        },
        {
          "enemy": "alien_normal",
          "at": 11.28
        },
        {
          "enemy": "alien_fast",
          "at": 11.92
        }
      ]
    },
    {
      "id": 6,
      "name": "Final assault",
      "healthScale": 1.5,
      "reward": 68,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 0.97
        },
        {
          "enemy": "alien_tank",
          "at": 1.5
        },
        {
          "enemy": "alien_fast",
          "at": 1.55
        },
        {
          "enemy": "alien_normal",
          "at": 2.13
        },
        {
          "enemy": "alien_normal",
          "at": 2.7
        },
        {
          "enemy": "alien_tank",
          "at": 3.27
        },
        {
          "enemy": "alien_fast",
          "at": 3.85
        },
        {
          "enemy": "alien_normal",
          "at": 4.42
        },
        {
          "enemy": "alien_normal",
          "at": 5
        },
        {
          "enemy": "alien_normal",
          "at": 5.58
        },
        {
          "enemy": "alien_fast",
          "at": 6.15
        },
        {
          "enemy": "alien_normal",
          "at": 6.72
        },
        {
          "enemy": "alien_tank",
          "at": 7.3
        },
        {
          "enemy": "alien_normal",
          "at": 7.88
        },
        {
          "enemy": "alien_fast",
          "at": 8.45
        },
        {
          "enemy": "alien_normal",
          "at": 9.03
        },
        {
          "enemy": "alien_normal",
          "at": 9.6
        },
        {
          "enemy": "alien_normal",
          "at": 10.17
        },
        {
          "enemy": "alien_fast",
          "at": 10.75
        },
        {
          "enemy": "alien_tank",
          "at": 11.32
        },
        {
          "enemy": "alien_normal",
          "at": 11.9
        }
      ]
    }
  ],
  "water": [
    {
      "row": 3,
      "col": 6
    },
    {
      "row": 5,
      "col": 6
    },
    {
      "row": 5,
      "col": 7
    },
    {
      "row": 5,
      "col": 8
    },
    {
      "row": 6,
      "col": 5
    },
    {
      "row": 6,
      "col": 6
    },
    {
      "row": 6,
      "col": 7
    }
  ]
};

export default level4;
