// 3-1 · Spore Fields. Authored route, obstacles, and wave schedule.
const level13 = {
  "id": "level_13",
  "name": "Spore Fields",
  "description": "Amber reactor pads boost tower damage. Alien growth blocks the best bends.",
  "sector": 3,
  "stage": 1,
  "biome": "hive",
  "rule": "Power pads",
  "recommendedLevel": 12,
  "cols": 16,
  "rows": 9,
  "tileSize": 48,
  "startGold": 555,
  "lives": 18,
  "threat": 2.9,
  "clearXp": 65,
  "firstClearXp": 110,
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
      "row": 1,
      "col": 4,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 3,
      "col": 6,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 5,
      "col": 4,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 7,
      "col": 6,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 5,
      "col": 8,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 7,
      "col": 10,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 0,
      "col": 8,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 2,
      "col": 10,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 0,
      "col": 12,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 2,
      "col": 14,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 4,
      "col": 12,
      "kind": "growth",
      "cost": 70
    },
    {
      "row": 6,
      "col": 14,
      "kind": "growth",
      "cost": 70
    }
  ],
  "pads": [
    {
      "row": 3,
      "col": 4,
      "type": "power"
    },
    {
      "row": 1,
      "col": 6,
      "type": "power"
    }
  ],
  "slowTiles": [],
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
      "row": 3,
      "col": 5
    },
    {
      "row": 4,
      "col": 5
    },
    {
      "row": 5,
      "col": 5
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
      "row": 5,
      "col": 9
    },
    {
      "row": 4,
      "col": 9
    },
    {
      "row": 3,
      "col": 9
    },
    {
      "row": 2,
      "col": 9
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
      "row": 1,
      "col": 12
    },
    {
      "row": 1,
      "col": 13
    },
    {
      "row": 2,
      "col": 13
    },
    {
      "row": 3,
      "col": 13
    },
    {
      "row": 4,
      "col": 13
    },
    {
      "row": 5,
      "col": 13
    },
    {
      "row": 5,
      "col": 14
    },
    {
      "row": 5,
      "col": 15
    }
  ],
  "waves": [
    {
      "id": 1,
      "name": "Fast flank",
      "healthScale": 1,
      "reward": 45,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.2
        },
        {
          "enemy": "alien_fast",
          "at": 2
        },
        {
          "enemy": "alien_normal",
          "at": 2.8
        },
        {
          "enemy": "alien_normal",
          "at": 3.6
        },
        {
          "enemy": "alien_normal",
          "at": 4.4
        },
        {
          "enemy": "alien_fast",
          "at": 5.2
        },
        {
          "enemy": "alien_normal",
          "at": 6
        },
        {
          "enemy": "alien_normal",
          "at": 6.8
        },
        {
          "enemy": "alien_normal",
          "at": 7.6
        }
      ]
    },
    {
      "id": 2,
      "name": "Shield formation",
      "healthScale": 1.1,
      "reward": 50,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.14
        },
        {
          "enemy": "alien_fast",
          "at": 1.87
        },
        {
          "enemy": "alien_shielded",
          "at": 2.6
        },
        {
          "enemy": "alien_normal",
          "at": 3.34
        },
        {
          "enemy": "alien_tank",
          "at": 4.08
        },
        {
          "enemy": "alien_fast",
          "at": 4.81
        },
        {
          "enemy": "alien_normal",
          "at": 5.54
        },
        {
          "enemy": "alien_shielded",
          "at": 6.28
        },
        {
          "enemy": "alien_normal",
          "at": 7.02
        },
        {
          "enemy": "alien_fast",
          "at": 7.75
        },
        {
          "enemy": "alien_normal",
          "at": 8.48
        }
      ]
    },
    {
      "id": 3,
      "name": "Shield formation",
      "healthScale": 1.2,
      "reward": 55,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.07
        },
        {
          "enemy": "alien_rager",
          "at": 1.74
        },
        {
          "enemy": "alien_shielded",
          "at": 2.41
        },
        {
          "enemy": "alien_normal",
          "at": 3.08
        },
        {
          "enemy": "alien_steadfast",
          "at": 3.75
        },
        {
          "enemy": "alien_fast",
          "at": 4.42
        },
        {
          "enemy": "alien_normal",
          "at": 5.09
        },
        {
          "enemy": "alien_shielded",
          "at": 5.76
        },
        {
          "enemy": "alien_normal",
          "at": 6.43
        },
        {
          "enemy": "alien_fast",
          "at": 7.1
        },
        {
          "enemy": "alien_normal",
          "at": 7.77
        },
        {
          "enemy": "alien_tank",
          "at": 8.44
        },
        {
          "enemy": "alien_shielded",
          "at": 9.11
        },
        {
          "enemy": "alien_fast",
          "at": 9.78
        },
        {
          "enemy": "alien_normal",
          "at": 10.45
        }
      ]
    },
    {
      "id": 4,
      "name": "Shield formation",
      "healthScale": 1.3,
      "reward": 60,
      "spawns": [
        {
          "enemy": "alien_broodmother",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1
        },
        {
          "enemy": "alien_rager",
          "at": 1.61
        },
        {
          "enemy": "alien_shielded",
          "at": 2.21
        },
        {
          "enemy": "alien_normal",
          "at": 2.82
        },
        {
          "enemy": "alien_steadfast",
          "at": 3.42
        },
        {
          "enemy": "alien_fast",
          "at": 4.03
        },
        {
          "enemy": "alien_normal",
          "at": 4.63
        },
        {
          "enemy": "alien_shielded",
          "at": 5.24
        },
        {
          "enemy": "alien_normal",
          "at": 5.84
        },
        {
          "enemy": "alien_fast",
          "at": 6.45
        },
        {
          "enemy": "alien_normal",
          "at": 7.05
        },
        {
          "enemy": "alien_tank",
          "at": 7.66
        },
        {
          "enemy": "alien_shielded",
          "at": 8.26
        },
        {
          "enemy": "alien_fast",
          "at": 8.87
        },
        {
          "enemy": "alien_normal",
          "at": 9.47
        },
        {
          "enemy": "alien_normal",
          "at": 10.08
        },
        {
          "enemy": "alien_normal",
          "at": 10.68
        }
      ]
    },
    {
      "id": 5,
      "name": "Shield formation",
      "healthScale": 1.4,
      "reward": 65,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 0.94
        },
        {
          "enemy": "alien_rager",
          "at": 1.48
        },
        {
          "enemy": "alien_shielded",
          "at": 2.02
        },
        {
          "enemy": "alien_normal",
          "at": 2.56
        },
        {
          "enemy": "alien_steadfast",
          "at": 3.1
        },
        {
          "enemy": "alien_fast",
          "at": 3.64
        },
        {
          "enemy": "alien_normal",
          "at": 4.18
        },
        {
          "enemy": "alien_shielded",
          "at": 4.72
        },
        {
          "enemy": "alien_normal",
          "at": 5.26
        },
        {
          "enemy": "alien_fast",
          "at": 5.8
        },
        {
          "enemy": "alien_normal",
          "at": 6.34
        },
        {
          "enemy": "alien_tank",
          "at": 6.88
        },
        {
          "enemy": "alien_shielded",
          "at": 7.42
        },
        {
          "enemy": "alien_fast",
          "at": 7.96
        },
        {
          "enemy": "alien_normal",
          "at": 8.5
        },
        {
          "enemy": "alien_normal",
          "at": 9.04
        },
        {
          "enemy": "alien_normal",
          "at": 9.58
        },
        {
          "enemy": "alien_shielded",
          "at": 10.12
        },
        {
          "enemy": "alien_tank",
          "at": 10.66
        }
      ]
    },
    {
      "id": 6,
      "name": "Shield formation",
      "healthScale": 1.5,
      "reward": 70,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 0.88
        },
        {
          "enemy": "alien_rager",
          "at": 1.35
        },
        {
          "enemy": "alien_shielded",
          "at": 1.82
        },
        {
          "enemy": "alien_normal",
          "at": 2.3
        },
        {
          "enemy": "alien_steadfast",
          "at": 2.77
        },
        {
          "enemy": "alien_fast",
          "at": 3.25
        },
        {
          "enemy": "alien_normal",
          "at": 3.72
        },
        {
          "enemy": "alien_shielded",
          "at": 4.2
        },
        {
          "enemy": "alien_normal",
          "at": 4.67
        },
        {
          "enemy": "alien_fast",
          "at": 5.15
        },
        {
          "enemy": "alien_normal",
          "at": 5.63
        },
        {
          "enemy": "alien_tank",
          "at": 6.1
        },
        {
          "enemy": "alien_shielded",
          "at": 6.58
        },
        {
          "enemy": "alien_fast",
          "at": 7.05
        },
        {
          "enemy": "alien_normal",
          "at": 7.53
        },
        {
          "enemy": "alien_normal",
          "at": 8
        },
        {
          "enemy": "alien_normal",
          "at": 8.47
        },
        {
          "enemy": "alien_shielded",
          "at": 8.95
        },
        {
          "enemy": "alien_tank",
          "at": 9.43
        },
        {
          "enemy": "alien_normal",
          "at": 9.9
        },
        {
          "enemy": "alien_normal",
          "at": 10.38
        }
      ]
    },
    {
      "id": 7,
      "name": "Shield formation",
      "healthScale": 1.6,
      "reward": 75,
      "spawns": [
        {
          "enemy": "alien_broodmother",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 0.81
        },
        {
          "enemy": "alien_rager",
          "at": 1.22
        },
        {
          "enemy": "alien_shielded",
          "at": 1.63
        },
        {
          "enemy": "alien_normal",
          "at": 2.04
        },
        {
          "enemy": "alien_steadfast",
          "at": 2.45
        },
        {
          "enemy": "alien_fast",
          "at": 2.86
        },
        {
          "enemy": "alien_normal",
          "at": 3.27
        },
        {
          "enemy": "alien_shielded",
          "at": 3.68
        },
        {
          "enemy": "alien_normal",
          "at": 4.09
        },
        {
          "enemy": "alien_fast",
          "at": 4.5
        },
        {
          "enemy": "alien_normal",
          "at": 4.91
        },
        {
          "enemy": "alien_tank",
          "at": 5.32
        },
        {
          "enemy": "alien_shielded",
          "at": 5.73
        },
        {
          "enemy": "alien_fast",
          "at": 6.14
        },
        {
          "enemy": "alien_normal",
          "at": 6.55
        },
        {
          "enemy": "alien_normal",
          "at": 6.96
        },
        {
          "enemy": "alien_normal",
          "at": 7.37
        },
        {
          "enemy": "alien_shielded",
          "at": 7.78
        },
        {
          "enemy": "alien_tank",
          "at": 8.19
        },
        {
          "enemy": "alien_normal",
          "at": 8.6
        },
        {
          "enemy": "alien_normal",
          "at": 9.01
        },
        {
          "enemy": "alien_fast",
          "at": 9.42
        },
        {
          "enemy": "alien_shielded",
          "at": 9.83
        }
      ]
    },
    {
      "id": 8,
      "name": "Final assault",
      "healthScale": 1.7,
      "reward": 80,
      "spawns": [
        {
          "enemy": "alien_broodmother",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 0.75
        },
        {
          "enemy": "alien_rager",
          "at": 1.1
        },
        {
          "enemy": "alien_shielded",
          "at": 1.45
        },
        {
          "enemy": "alien_steadfast",
          "at": 1.5
        },
        {
          "enemy": "alien_normal",
          "at": 1.8
        },
        {
          "enemy": "alien_tank",
          "at": 2.15
        },
        {
          "enemy": "alien_fast",
          "at": 2.5
        },
        {
          "enemy": "alien_normal",
          "at": 2.85
        },
        {
          "enemy": "alien_shielded",
          "at": 3.2
        },
        {
          "enemy": "alien_normal",
          "at": 3.55
        },
        {
          "enemy": "alien_fast",
          "at": 3.9
        },
        {
          "enemy": "alien_normal",
          "at": 4.25
        },
        {
          "enemy": "alien_tank",
          "at": 4.6
        },
        {
          "enemy": "alien_shielded",
          "at": 4.95
        },
        {
          "enemy": "alien_fast",
          "at": 5.3
        },
        {
          "enemy": "alien_normal",
          "at": 5.65
        },
        {
          "enemy": "alien_normal",
          "at": 6
        },
        {
          "enemy": "alien_normal",
          "at": 6.35
        },
        {
          "enemy": "alien_shielded",
          "at": 6.7
        },
        {
          "enemy": "alien_tank",
          "at": 7.05
        },
        {
          "enemy": "alien_normal",
          "at": 7.4
        },
        {
          "enemy": "alien_normal",
          "at": 7.75
        },
        {
          "enemy": "alien_fast",
          "at": 8.1
        },
        {
          "enemy": "alien_shielded",
          "at": 8.45
        },
        {
          "enemy": "alien_normal",
          "at": 8.8
        },
        {
          "enemy": "alien_normal",
          "at": 9.15
        }
      ]
    }
  ]
};

export default level13;
