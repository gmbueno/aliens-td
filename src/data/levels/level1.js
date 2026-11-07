// 1-1 · Introductory mission. Authored route and waves.
const level1 = {
  "id": "level_1",
  "name": "Landing Zone",
  "description": "Three weapons, two alien types. Find a bend and hold the line.",
  "sector": 1,
  "stage": 1,
  "biome": "outpost",
  "rule": "Crossfire",
  "recommendedLevel": 1,
  "cols": 16,
  "rows": 9,
  "tileSize": 48,
  "startGold": 360,
  "lives": 18,
  "threat": 0.62,
  "clearXp": 45,
  "firstClearXp": 50,
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
  "pads": [
    {
      "row": 5,
      "col": 3,
      "type": "range"
    },
    {
      "row": 1,
      "col": 5,
      "type": "range"
    }
  ],
  "track": [
    {
      "col": 0,
      "row": 4
    },
    {
      "row": 4,
      "col": 1
    },
    {
      "row": 4,
      "col": 2
    },
    {
      "row": 4,
      "col": 3
    },
    {
      "row": 4,
      "col": 4
    },
    {
      "row": 3,
      "col": 4
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
      "row": 2,
      "col": 7
    },
    {
      "row": 2,
      "col": 8
    },
    {
      "row": 2,
      "col": 9
    },
    {
      "row": 3,
      "col": 9
    },
    {
      "row": 4,
      "col": 9
    },
    {
      "row": 5,
      "col": 9
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
      "row": 6,
      "col": 13
    },
    {
      "row": 5,
      "col": 13
    },
    {
      "row": 4,
      "col": 13
    },
    {
      "row": 4,
      "col": 14
    },
    {
      "row": 4,
      "col": 15
    }
  ],
  "waves": [
    {
      "id": 1,
      "name": "First contact",
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
          "enemy": "alien_normal",
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
          "enemy": "alien_normal",
          "at": 5.8
        },
        {
          "enemy": "alien_normal",
          "at": 6.7
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
        }
      ]
    },
    {
      "id": 4,
      "name": "Hold the line",
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
        }
      ]
    }
  ]
};

export default level1;
