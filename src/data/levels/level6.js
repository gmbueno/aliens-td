// 1-6 · Outpost Siege. Authored route, terrain and waves.
const level6 = {
  "id": "level_6",
  "name": "Outpost Siege",
  "description": "The Overseer leads the assault. Set heavy weapons to Strongest. Amber overdrive tiles make aliens 35% faster. Cover their exits.",
  "sector": 1,
  "stage": 6,
  "biome": "outpost",
  "rule": "Boss",
  "recommendedLevel": 6,
  "cols": 16,
  "rows": 9,
  "tileSize": 48,
  "startGold": 260,
  "lives": 18,
  "threat": 1.7,
  "clearXp": 45,
  "firstClearXp": 75,
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
      "row": 6,
      "col": 2,
      "kind": "barrels",
      "cost": 50
    },
    {
      "row": 8,
      "col": 4,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 0,
      "col": 2,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 2,
      "col": 4,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 0,
      "col": 7,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 2,
      "col": 9,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 5,
      "col": 7,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 7,
      "col": 9,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 5,
      "col": 11,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 7,
      "col": 13,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 2,
      "col": 11,
      "kind": "cargo",
      "cost": 50
    },
    {
      "row": 4,
      "col": 13,
      "kind": "cargo",
      "cost": 50
    }
  ],
  "pads": [
    {
      "row": 6,
      "col": 4,
      "type": "range"
    },
    {
      "row": 2,
      "col": 2,
      "type": "range"
    }
  ],
  "slowTiles": [],
  "track": [
    {
      "col": 0,
      "row": 7
    },
    {
      "row": 7,
      "col": 1
    },
    {
      "row": 7,
      "col": 2
    },
    {
      "row": 7,
      "col": 3
    },
    {
      "row": 6,
      "col": 3
    },
    {
      "row": 5,
      "col": 3
    },
    {
      "row": 4,
      "col": 3
    },
    {
      "row": 3,
      "col": 3
    },
    {
      "row": 2,
      "col": 3
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
      "row": 2,
      "col": 8
    },
    {
      "row": 3,
      "col": 8
    },
    {
      "row": 4,
      "col": 8
    },
    {
      "row": 5,
      "col": 8
    },
    {
      "row": 6,
      "col": 8
    },
    {
      "row": 6,
      "col": 9
    },
    {
      "row": 6,
      "col": 10
    },
    {
      "row": 6,
      "col": 11
    },
    {
      "row": 6,
      "col": 12
    },
    {
      "row": 5,
      "col": 12
    },
    {
      "row": 4,
      "col": 12
    },
    {
      "row": 3,
      "col": 12
    },
    {
      "row": 3,
      "col": 13
    },
    {
      "row": 3,
      "col": 14
    },
    {
      "row": 3,
      "col": 15
    }
  ],
  "waves": [
    {
      "id": 1,
      "name": "Fast flank",
      "healthScale": 1,
      "reward": 35,
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
        },
        {
          "enemy": "alien_normal",
          "at": 10.3
        },
        {
          "enemy": "alien_normal",
          "at": 11.2
        }
      ]
    },
    {
      "id": 2,
      "name": "Armored convoy",
      "healthScale": 1.1,
      "reward": 40,
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
          "enemy": "alien_tank",
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
          "enemy": "alien_tank",
          "at": 10.42
        },
        {
          "enemy": "alien_normal",
          "at": 11.26
        },
        {
          "enemy": "alien_fast",
          "at": 12.09
        }
      ]
    },
    {
      "id": 3,
      "name": "Armored convoy",
      "healthScale": 1.2,
      "reward": 45,
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
          "enemy": "alien_rager",
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
        },
        {
          "enemy": "alien_normal",
          "at": 11.95
        },
        {
          "enemy": "alien_normal",
          "at": 12.72
        }
      ]
    },
    {
      "id": 4,
      "name": "Armored convoy",
      "healthScale": 1.3,
      "reward": 50,
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
          "enemy": "alien_rager",
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
        },
        {
          "enemy": "alien_normal",
          "at": 12.38
        },
        {
          "enemy": "alien_fast",
          "at": 13.09
        }
      ]
    },
    {
      "id": 5,
      "name": "Armored convoy",
      "healthScale": 1.4,
      "reward": 55,
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
          "enemy": "alien_rager",
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
        },
        {
          "enemy": "alien_tank",
          "at": 12.56
        },
        {
          "enemy": "alien_normal",
          "at": 13.2
        }
      ]
    },
    {
      "id": 6,
      "name": "Final assault",
      "healthScale": 1.5,
      "reward": 60,
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
          "enemy": "alien_boss",
          "at": 1.5
        },
        {
          "enemy": "alien_rager",
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
        },
        {
          "enemy": "alien_normal",
          "at": 12.47
        },
        {
          "enemy": "alien_fast",
          "at": 13.05
        }
      ]
    }
  ],
  "speedTiles": [
    {
      "row": 3,
      "col": 3
    },
    {
      "row": 2,
      "col": 3
    },
    {
      "row": 6,
      "col": 9
    },
    {
      "row": 6,
      "col": 10
    }
  ]
};

export default level6;
