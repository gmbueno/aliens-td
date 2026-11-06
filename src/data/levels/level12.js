// 2-6 · Cold Reactor. Authored route, terrain and waves.
const level12 = {
  "id": "level_12",
  "name": "Cold Reactor",
  "description": "An armored escort guards the Overseer. Build for both threats. Amber overdrive tiles make aliens 35% faster. Cover their exits.",
  "sector": 2,
  "stage": 6,
  "biome": "frost",
  "rule": "Boss escort",
  "recommendedLevel": 11,
  "cols": 16,
  "rows": 9,
  "tileSize": 48,
  "startGold": 420,
  "lives": 18,
  "threat": 2.363,
  "clearXp": 55,
  "firstClearXp": 105,
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
      "col": 5,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 8,
      "col": 7,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 3,
      "col": 5,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 5,
      "col": 7,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 3,
      "col": 1,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 5,
      "col": 3,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 0,
      "col": 1,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 2,
      "col": 3,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 0,
      "col": 10,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 2,
      "col": 12,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 5,
      "col": 10,
      "kind": "ice",
      "cost": 60
    },
    {
      "row": 7,
      "col": 12,
      "kind": "ice",
      "cost": 60
    }
  ],
  "pads": [
    {
      "row": 6,
      "col": 7,
      "type": "range"
    },
    {
      "row": 5,
      "col": 5,
      "type": "range"
    }
  ],
  "slowTiles": [
    {
      "row": 7,
      "col": 1
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
      "row": 1,
      "col": 4
    },
    {
      "row": 1,
      "col": 5
    },
    {
      "row": 3,
      "col": 11
    },
    {
      "row": 4,
      "col": 11
    }
  ],
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
      "row": 6,
      "col": 6
    },
    {
      "row": 5,
      "col": 6
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
      "row": 4,
      "col": 3
    },
    {
      "row": 4,
      "col": 2
    },
    {
      "row": 3,
      "col": 2
    },
    {
      "row": 2,
      "col": 2
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
      "row": 5,
      "col": 11
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
      "row": 6,
      "col": 14
    },
    {
      "row": 6,
      "col": 15
    }
  ],
  "waves": [
    {
      "id": 1,
      "name": "Fast flank",
      "healthScale": 1,
      "reward": 48,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.25
        },
        {
          "enemy": "alien_fast",
          "at": 2.1
        },
        {
          "enemy": "alien_normal",
          "at": 2.95
        },
        {
          "enemy": "alien_normal",
          "at": 3.8
        },
        {
          "enemy": "alien_normal",
          "at": 4.65
        },
        {
          "enemy": "alien_fast",
          "at": 5.5
        },
        {
          "enemy": "alien_normal",
          "at": 6.35
        },
        {
          "enemy": "alien_normal",
          "at": 7.2
        },
        {
          "enemy": "alien_normal",
          "at": 8.05
        }
      ]
    },
    {
      "id": 2,
      "name": "Shield formation",
      "healthScale": 1.1,
      "reward": 53,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.19
        },
        {
          "enemy": "alien_fast",
          "at": 1.97
        },
        {
          "enemy": "alien_shielded",
          "at": 2.75
        },
        {
          "enemy": "alien_normal",
          "at": 3.54
        },
        {
          "enemy": "alien_tank",
          "at": 4.33
        },
        {
          "enemy": "alien_fast",
          "at": 5.11
        },
        {
          "enemy": "alien_normal",
          "at": 5.9
        },
        {
          "enemy": "alien_shielded",
          "at": 6.68
        },
        {
          "enemy": "alien_normal",
          "at": 7.47
        },
        {
          "enemy": "alien_fast",
          "at": 8.25
        },
        {
          "enemy": "alien_normal",
          "at": 9.04
        }
      ]
    },
    {
      "id": 3,
      "name": "Shield formation",
      "healthScale": 1.2,
      "reward": 58,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.12
        },
        {
          "enemy": "alien_rager",
          "at": 1.84
        },
        {
          "enemy": "alien_medic",
          "at": 2.56
        },
        {
          "enemy": "alien_normal",
          "at": 3.28
        },
        {
          "enemy": "alien_steadfast",
          "at": 4
        },
        {
          "enemy": "alien_fast",
          "at": 4.72
        },
        {
          "enemy": "alien_normal",
          "at": 5.44
        },
        {
          "enemy": "alien_shielded",
          "at": 6.16
        },
        {
          "enemy": "alien_normal",
          "at": 6.88
        },
        {
          "enemy": "alien_fast",
          "at": 7.6
        },
        {
          "enemy": "alien_normal",
          "at": 8.32
        },
        {
          "enemy": "alien_tank",
          "at": 9.04
        },
        {
          "enemy": "alien_shielded",
          "at": 9.76
        },
        {
          "enemy": "alien_fast",
          "at": 10.48
        },
        {
          "enemy": "alien_normal",
          "at": 11.2
        },
        {
          "enemy": "alien_normal",
          "at": 11.92
        },
        {
          "enemy": "alien_normal",
          "at": 12.64
        },
        {
          "enemy": "alien_shielded",
          "at": 13.36
        }
      ]
    },
    {
      "id": 4,
      "name": "Shield formation",
      "healthScale": 1.3,
      "reward": 63,
      "spawns": [
        {
          "enemy": "alien_broodmother",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 1.05
        },
        {
          "enemy": "alien_rager",
          "at": 1.71
        },
        {
          "enemy": "alien_medic",
          "at": 2.36
        },
        {
          "enemy": "alien_normal",
          "at": 3.02
        },
        {
          "enemy": "alien_steadfast",
          "at": 3.67
        },
        {
          "enemy": "alien_fast",
          "at": 4.33
        },
        {
          "enemy": "alien_normal",
          "at": 4.98
        },
        {
          "enemy": "alien_shielded",
          "at": 5.64
        },
        {
          "enemy": "alien_normal",
          "at": 6.29
        },
        {
          "enemy": "alien_fast",
          "at": 6.95
        },
        {
          "enemy": "alien_normal",
          "at": 7.6
        },
        {
          "enemy": "alien_tank",
          "at": 8.26
        },
        {
          "enemy": "alien_shielded",
          "at": 8.91
        },
        {
          "enemy": "alien_fast",
          "at": 9.57
        },
        {
          "enemy": "alien_normal",
          "at": 10.22
        },
        {
          "enemy": "alien_normal",
          "at": 10.88
        },
        {
          "enemy": "alien_normal",
          "at": 11.53
        },
        {
          "enemy": "alien_shielded",
          "at": 12.19
        },
        {
          "enemy": "alien_tank",
          "at": 12.84
        },
        {
          "enemy": "alien_normal",
          "at": 13.5
        }
      ]
    },
    {
      "id": 5,
      "name": "Shield formation",
      "healthScale": 1.4,
      "reward": 68,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 0.99
        },
        {
          "enemy": "alien_rager",
          "at": 1.58
        },
        {
          "enemy": "alien_medic",
          "at": 2.17
        },
        {
          "enemy": "alien_normal",
          "at": 2.76
        },
        {
          "enemy": "alien_steadfast",
          "at": 3.35
        },
        {
          "enemy": "alien_fast",
          "at": 3.94
        },
        {
          "enemy": "alien_normal",
          "at": 4.53
        },
        {
          "enemy": "alien_shielded",
          "at": 5.12
        },
        {
          "enemy": "alien_normal",
          "at": 5.71
        },
        {
          "enemy": "alien_fast",
          "at": 6.3
        },
        {
          "enemy": "alien_normal",
          "at": 6.89
        },
        {
          "enemy": "alien_tank",
          "at": 7.48
        },
        {
          "enemy": "alien_shielded",
          "at": 8.07
        },
        {
          "enemy": "alien_fast",
          "at": 8.66
        },
        {
          "enemy": "alien_normal",
          "at": 9.25
        },
        {
          "enemy": "alien_normal",
          "at": 9.84
        },
        {
          "enemy": "alien_normal",
          "at": 10.43
        },
        {
          "enemy": "alien_shielded",
          "at": 11.02
        },
        {
          "enemy": "alien_tank",
          "at": 11.61
        },
        {
          "enemy": "alien_normal",
          "at": 12.2
        },
        {
          "enemy": "alien_normal",
          "at": 12.79
        },
        {
          "enemy": "alien_fast",
          "at": 13.38
        }
      ]
    },
    {
      "id": 6,
      "name": "Shield formation",
      "healthScale": 1.5,
      "reward": 73,
      "spawns": [
        {
          "enemy": "alien_normal",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 0.93
        },
        {
          "enemy": "alien_rager",
          "at": 1.45
        },
        {
          "enemy": "alien_medic",
          "at": 1.98
        },
        {
          "enemy": "alien_normal",
          "at": 2.5
        },
        {
          "enemy": "alien_steadfast",
          "at": 3.02
        },
        {
          "enemy": "alien_fast",
          "at": 3.55
        },
        {
          "enemy": "alien_normal",
          "at": 4.08
        },
        {
          "enemy": "alien_shielded",
          "at": 4.6
        },
        {
          "enemy": "alien_normal",
          "at": 5.13
        },
        {
          "enemy": "alien_fast",
          "at": 5.65
        },
        {
          "enemy": "alien_normal",
          "at": 6.18
        },
        {
          "enemy": "alien_tank",
          "at": 6.7
        },
        {
          "enemy": "alien_shielded",
          "at": 7.23
        },
        {
          "enemy": "alien_fast",
          "at": 7.75
        },
        {
          "enemy": "alien_normal",
          "at": 8.28
        },
        {
          "enemy": "alien_normal",
          "at": 8.8
        },
        {
          "enemy": "alien_normal",
          "at": 9.33
        },
        {
          "enemy": "alien_shielded",
          "at": 9.85
        },
        {
          "enemy": "alien_tank",
          "at": 10.38
        },
        {
          "enemy": "alien_normal",
          "at": 10.9
        },
        {
          "enemy": "alien_normal",
          "at": 11.43
        },
        {
          "enemy": "alien_fast",
          "at": 11.95
        },
        {
          "enemy": "alien_shielded",
          "at": 12.48
        },
        {
          "enemy": "alien_normal",
          "at": 13
        }
      ]
    },
    {
      "id": 7,
      "name": "Final assault",
      "healthScale": 1.6,
      "reward": 78,
      "spawns": [
        {
          "enemy": "alien_broodmother",
          "at": 0.4
        },
        {
          "enemy": "alien_normal",
          "at": 0.86
        },
        {
          "enemy": "alien_rager",
          "at": 1.32
        },
        {
          "enemy": "alien_boss",
          "at": 1.5
        },
        {
          "enemy": "alien_medic",
          "at": 1.78
        },
        {
          "enemy": "alien_normal",
          "at": 2.24
        },
        {
          "enemy": "alien_steadfast",
          "at": 2.7
        },
        {
          "enemy": "alien_fast",
          "at": 3.16
        },
        {
          "enemy": "alien_normal",
          "at": 3.62
        },
        {
          "enemy": "alien_shielded",
          "at": 4.08
        },
        {
          "enemy": "alien_normal",
          "at": 4.54
        },
        {
          "enemy": "alien_fast",
          "at": 5
        },
        {
          "enemy": "alien_normal",
          "at": 5.46
        },
        {
          "enemy": "alien_tank",
          "at": 5.92
        },
        {
          "enemy": "alien_shielded",
          "at": 6.38
        },
        {
          "enemy": "alien_fast",
          "at": 6.84
        },
        {
          "enemy": "alien_normal",
          "at": 7.3
        },
        {
          "enemy": "alien_normal",
          "at": 7.76
        },
        {
          "enemy": "alien_normal",
          "at": 8.22
        },
        {
          "enemy": "alien_shielded",
          "at": 8.68
        },
        {
          "enemy": "alien_tank",
          "at": 9.14
        },
        {
          "enemy": "alien_normal",
          "at": 9.6
        },
        {
          "enemy": "alien_normal",
          "at": 10.06
        },
        {
          "enemy": "alien_fast",
          "at": 10.52
        },
        {
          "enemy": "alien_shielded",
          "at": 10.98
        },
        {
          "enemy": "alien_normal",
          "at": 11.44
        },
        {
          "enemy": "alien_normal",
          "at": 11.9
        },
        {
          "enemy": "alien_tank",
          "at": 12.36
        }
      ]
    }
  ],
  "speedTiles": [
    {
      "row": 5,
      "col": 6
    },
    {
      "row": 1,
      "col": 9
    },
    {
      "row": 1,
      "col": 10
    }
  ]
};

export default level12;
