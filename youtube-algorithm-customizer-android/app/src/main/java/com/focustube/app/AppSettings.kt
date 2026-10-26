package com.focustube.app

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/** 피드 주제 프리셋. 크롬 확장판(common/presets.js)과 동일한 구성. */
data class Preset(
    val id: String,
    val name: String,
    val description: String,
    val keywords: List<String>
)

object AppSettings {

    val PRESETS = listOf(
        Preset(
            "study", "수험생 · 공부 자극", "공부 동기부여, 스터디윗미, 공부법 영상 위주",
            listOf(
                "공부 자극 영상", "공부 동기부여", "study with me", "스터디윗미 실시간",
                "수능 공부법", "의대생 공부 브이로그", "서울대생 공부 루틴", "10시간 공부 타이머"
            )
        ),
        Preset(
            "english", "영어 공부", "영어 회화, 리스닝, 단어 암기 영상 위주",
            listOf(
                "영어 회화 연습", "영어 리스닝 훈련", "영어 쉐도잉",
                "english listening practice", "영어 단어 암기법", "기초 영문법 강의"
            )
        ),
        Preset(
            "dev", "개발 · 커리어", "프로그래밍 강의, 개발자 커리어 영상 위주",
            listOf(
                "코딩 강의", "프로그래밍 입문", "개발자 브이로그",
                "알고리즘 문제 풀이", "CS 지식 면접", "개발자 커리어 조언"
            )
        ),
        Preset(
            "fitness", "운동 · 건강", "홈트레이닝, 운동 루틴, 건강 관리 영상 위주",
            listOf(
                "홈트레이닝 루틴", "맨몸 운동", "헬스 초보 루틴",
                "스트레칭 10분", "달리기 동기부여", "건강한 식단"
            )
        ),
        Preset(
            "reading", "독서 · 교양", "책 리뷰, 인문학, 다큐멘터리 영상 위주",
            listOf(
                "책 추천 리뷰", "인문학 강의", "역사 다큐멘터리",
                "과학 교양", "경제 공부 기초", "철학 입문 강의"
            )
        )
    )

    const val CUSTOM_ID = "custom"

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences("focustube", Context.MODE_PRIVATE)

    var Context.enabled: Boolean
        get() = prefs(this).getBoolean("enabled", true)
        set(v) = prefs(this).edit().putBoolean("enabled", v).apply()

    var Context.presetId: String
        get() = prefs(this).getString("presetId", "study")!!
        set(v) = prefs(this).edit().putString("presetId", v).apply()

    var Context.customKeywords: String
        get() = prefs(this).getString("customKeywords", "")!!
        set(v) = prefs(this).edit().putString("customKeywords", v).apply()

    var Context.hideShorts: Boolean
        get() = prefs(this).getBoolean("hideShorts", true)
        set(v) = prefs(this).edit().putBoolean("hideShorts", v).apply()

    var Context.hideRelated: Boolean
        get() = prefs(this).getBoolean("hideRelated", false)
        set(v) = prefs(this).edit().putBoolean("hideRelated", v).apply()

    var Context.hideComments: Boolean
        get() = prefs(this).getBoolean("hideComments", false)
        set(v) = prefs(this).edit().putBoolean("hideComments", v).apply()

    private fun activeKeywords(context: Context): List<String> {
        val id = context.presetId
        if (id == CUSTOM_ID) {
            return context.customKeywords.lines().map { it.trim() }.filter { it.isNotEmpty() }
        }
        return PRESETS.find { it.id == id }?.keywords ?: emptyList()
    }

    private fun presetName(context: Context): String {
        if (context.presetId == CUSTOM_ID) return "사용자 정의"
        return PRESETS.find { it.id == context.presetId }?.name ?: ""
    }

    /** WebView에 주입되는 스크립트가 읽어가는 설정 JSON. */
    fun toJson(context: Context): String = JSONObject().apply {
        put("enabled", context.enabled)
        put("presetId", context.presetId)
        put("presetName", presetName(context))
        put("keywords", JSONArray(activeKeywords(context)))
        put("hideShorts", context.hideShorts)
        put("hideRelated", context.hideRelated)
        put("hideComments", context.hideComments)
    }.toString()
}
