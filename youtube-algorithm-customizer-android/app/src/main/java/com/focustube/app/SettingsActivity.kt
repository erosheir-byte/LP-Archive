package com.focustube.app

import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.RadioButton
import android.widget.RadioGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
import androidx.core.widget.doAfterTextChanged
import com.focustube.app.AppSettings.customKeywords
import com.focustube.app.AppSettings.enabled
import com.focustube.app.AppSettings.hideComments
import com.focustube.app.AppSettings.hideRelated
import com.focustube.app.AppSettings.hideShorts
import com.focustube.app.AppSettings.presetId

class SettingsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        val group = findViewById<RadioGroup>(R.id.preset_group)
        val customBox = findViewById<EditText>(R.id.custom_keywords)

        val options = AppSettings.PRESETS.map { Triple(it.id, it.name, it.description) } +
            Triple(AppSettings.CUSTOM_ID, "사용자 정의", "원하는 검색 키워드 직접 입력 (한 줄에 하나)")

        for ((id, name, description) in options) {
            val radio = RadioButton(this)
            radio.text = "$name — $description"
            radio.tag = id
            radio.setPadding(8, 24, 8, 24)
            radio.isChecked = id == presetId
            radio.setOnClickListener {
                presetId = id
                customBox.visibility =
                    if (id == AppSettings.CUSTOM_ID) View.VISIBLE else View.GONE
            }
            group.addView(radio)
        }

        customBox.setText(customKeywords)
        customBox.visibility =
            if (presetId == AppSettings.CUSTOM_ID) View.VISIBLE else View.GONE
        customBox.doAfterTextChanged { customKeywords = it?.toString() ?: "" }

        bindSwitch(R.id.sw_enabled, enabled) { enabled = it }
        bindSwitch(R.id.sw_hide_shorts, hideShorts) { hideShorts = it }
        bindSwitch(R.id.sw_hide_related, hideRelated) { hideRelated = it }
        bindSwitch(R.id.sw_hide_comments, hideComments) { hideComments = it }
    }

    private fun bindSwitch(viewId: Int, initial: Boolean, onChange: (Boolean) -> Unit) {
        val sw = findViewById<SwitchCompat>(viewId)
        sw.isChecked = initial
        sw.setOnCheckedChangeListener { _, checked -> onChange(checked) }
    }
}
