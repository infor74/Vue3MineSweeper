<script setup lang="ts">
import { onBeforeUnmount, ref, toRaw } from 'vue';
import Game, { GameLevel }from '@/class/game';

import { ElButton, ElButtonGroup, ElMessageBox, ElIcon } from 'element-plus';
import { Flag, QuestionFilled } from '@element-plus/icons-vue'

type CurrentGameLevel = typeof GameLevel[keyof typeof GameLevel]

const currentLevel = ref<CurrentGameLevel>(GameLevel.normal)
const game = ref(new Game(toRaw(currentLevel.value), ElMessageBox));

onBeforeUnmount(() => {
  game.value?.stopTimer();
})

function toggleLevel(level: CurrentGameLevel) {
  game.value?.stopTimer();
  currentLevel.value = level;
  game.value = new Game(level, ElMessageBox);
}

</script>

<template>
  <h2 style="margin-top: 8px">MineSweeper</h2>
  <div
      class="container"
  >
    <el-button-group>
      <template v-for="level of GameLevel">
        <el-button
            :type="currentLevel.text === level.text ? 'primary' : 'default'"
            @click="() => toggleLevel(level)"
        >{{level.text}}</el-button>
      </template>
    </el-button-group>
    <table class="head">
      <thead>
        <tr>
        <td width="50%"
            align="left"
        >
          <span class="counter-board">剩余地雷: {{ game.totalMines }}</span>
        </td>
        <td align="center">
          <el-button @click="() => game.reset()">重新开始</el-button>
        </td>
        <td width="50%"
            align="right"
        >
          <span class="counter-board">耗时: {{ game.timerSeconds }}</span>
        </td>
      </tr>
      </thead>
    </table>
    <table v-if="game.grid.length"
           class="grid-table"
           @click.right.prevent.stop="() => {}"
    >
      <tbody>
        <tr v-for="(row, i) in game.grid"
            :key="i"
        >
          <td v-for="(cell, j) in row"
              :key="j"
              :class="`cell ${cell.opened ? 'opened' : 'default'} ${cell.mark}`"
              @click.left="() => cell.handleLeftClick(game)"
              @click.right.prevent="() => cell.handleRightClick(game)"
          >
              <span
                  v-if="cell.opened && cell.adjacentMines"
              >{{ cell.adjacentMines }}</span>
            <el-icon
                v-if="cell.mark !== 'none'"
            >
              <Flag v-if="cell.mark === 'flag'" color="red" />
              <QuestionFilled v-if="cell.mark === 'question'" color="sandybrown" />
            </el-icon>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
$dark-border: gray;
$light-border: white;
$border-width: 4px;
$bg: lightgray;

.container {
  background: $bg;
  border-radius: 4px;
  width: auto;
  padding: 8px;
}

.head {
  padding: 1em 0;
}

.counter-board {
  border-radius: 3px;
  padding: .5em 1em;
  background: #08060d;
  color: red;
  font-weight: bold;
}

table {
  table-layout: fixed;
  //border-collapse: collapse;
}

.grid {
  &-table {
    min-width: 400px;
    min-height: 400px;
    //background-color: $bg;
    border-radius: 4px;
    border: solid $border-width;
    border-top-color: $dark-border;
    border-left-color: $dark-border;
    border-bottom-color: $light-border;
    border-right-color: $light-border;
  }
}

.cell {
  width: 32px;
  min-width: 32px;
  height: 32px;
  min-height: 32px;
  padding: 0; /* 清除默认内边距！非常关键 */
  text-align: center;
  box-sizing: border-box;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  line-height: 1em;
  user-select: none;

  &.default {
    background-color: $bg;
    border: solid $border-width;
    border-right-color: $dark-border;
    border-bottom-color: $dark-border;
    border-left-color: $light-border;
    border-top-color: $light-border;

    &:active {
      background-color: whitesmoke;
      border-top-color: $dark-border;
      border-left-color: $dark-border;
      border-bottom-color: $light-border;
      border-right-color: $light-border;
    }
  }

  &.opened {
    border: dashed 2px;
    border-color: #aaa;
  }
}
</style>