// 1-2 · Introductory mission. Authored route and waves.
const level2 = {
  "id": "level_2",
  "name": "Wide Crossing",
  "description": "Cover both bends. Skitters move quickly; Machine Pistols slow them down.",
  "sector": 1,
  "stage": 2,
  "biome": "outpost",
  "rule": "Crossfire",
  "recommendedLevel": 2,
  "cols": 16,
  "rows": 9,
  "tileSize": 48,
  "startGold": 350,
  "lives": 18,
  "threat": 0.83,
  "clearXp": 45,
  "firstClearXp": 55,
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
    }
  ],
  "pads": [],
  "track": [
    {
      "col": 0,
      "row": 2
    },
    {
      "row": 2,
      "col": 1
    },
    {
      "row": 2,
      "col": 2
    },
    {
      "row": 2,
      "col": 3
    },
    {
      "row": 2,
      "col": 4
    },
    {
      "row": 2,
      "col": 5
    },
    {
      "row": 2,
      "col": 6
    },
    {
      "row": 3,
      "col": 6
    },
    {
      "row": 4,
      "col": 6
    },
    {
      "row": 5,
      "col": 6
    },
    {
      "row": 6,
      "col": 6
    },
    {
      "row": 6,
      "col": 7
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
      "row": 5,
      "col": 11
    },
    {
      "row": 4,
      "col": 11
    },
    {
      "row": 3,
      "col": 11
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
        }
      ]
    },
    {
      "id": 2,
      "name": "Fast flank",
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
        }
      ]
    },
    {
      "id": 3,
      "name": "Fast flank",
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
          "enemy": "alien_normal",
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
          "enemy": "alien_normal",
          "at": 9.64
        }
      ]
    },
    {
      "id": 4,
      "name": "Fast flank",
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
          "enemy": "alien_normal",
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
          "enemy": "alien_normal",
          "at": 8.86
        },
        {
          "enemy": "alien_normal",
          "at": 9.56
        },
        {
          "enemy": "alien_fast",
          "at": 10.27
        }
      ]
    },
    {
      "id": 5,
      "name": "Final assault",
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
          "enemy": "alien_normal",
          "at": 1.5
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
          "enemy": "alien_normal",
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
          "enemy": "alien_normal",
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
        }
      ]
    }
  ]
};

export default level2;
