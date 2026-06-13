import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/theme/tokens";
import { ENV } from "@/lib/env";
import { session } from "@/lib/session";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui";
import { webTextStyle, webViewStyle } from "@/lib/webStyles";

export default function Login() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const twoCol = width >= 900;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  function submit() {
    if (username.trim() === ENV.ADMIN_USERNAME && password === ENV.ADMIN_PASSWORD) {
      session.login();
      setErr("");
      router.replace("/dashboard");
    } else {
      setErr("Invalid credentials.");
    }
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: twoCol ? "row" : "column",
        backgroundColor: COLORS.canvas,
      }}
    >
      {/* Brand panel */}
      {twoCol && (
        <View
          style={webViewStyle({
            flex: 1.05,
            backgroundColor: COLORS.orange,
            padding: 60,
            justifyContent: "space-between",
            backgroundImage: "linear-gradient(150deg, #F0733C, #C8481B)",
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 13 }}>
            <Image
              source={require("../../assets/oolshik-logo.png")}
              style={{ width: 46, height: 46, borderRadius: 12 }}
            />
            <Text style={{ color: COLORS.cream, fontWeight: "800", fontSize: 22 }}>oolshik</Text>
          </View>
          <View>
            <Text
              style={{
                color: COLORS.cream,
                fontSize: 40,
                fontWeight: "800",
                lineHeight: 44,
                letterSpacing: -1,
                maxWidth: 460,
              }}
            >
              Run the neighbourhood help network.
            </Text>
            <Text
              style={{
                color: COLORS.cream + "D9",
                fontSize: 16.5,
                lineHeight: 26,
                marginTop: 18,
                maxWidth: 440,
              }}
            >
              Moderate requests, manage netas & karyakartas, audit OTPs, transcripts, payments and
              reports — all from one console.
            </Text>
          </View>
          <Text style={{ color: COLORS.cream + "B3", fontSize: 13 }}>Internal only</Text>
        </View>
      )}

      {/* Form panel */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <View style={{ width: "100%", maxWidth: 380 }}>
          {!twoCol && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 11,
                marginBottom: 28,
              }}
            >
              <Image
                source={require("../../assets/oolshik-logo.png")}
                style={{ width: 40, height: 40, borderRadius: 10 }}
              />
              <Text style={{ fontWeight: "800", fontSize: 20, color: COLORS.text }}>oolshik</Text>
            </View>
          )}
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              letterSpacing: -0.5,
              color: COLORS.text,
            }}
          >
            Sign in
          </Text>
          <Text
            style={{
              fontSize: 14.5,
              color: COLORS.text2,
              marginTop: 6,
              marginBottom: 28,
            }}
          >
            Enter your admin credentials to continue.
          </Text>

          <Text style={labelStyle}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="admin-username"
            placeholderTextColor={COLORS.text3}
            autoCapitalize="none"
            autoCorrect={false}
            style={inputStyle}
          />

          <Text style={[labelStyle, { marginTop: 18 }]}>Password</Text>
          <View style={{ position: "relative", justifyContent: "center" }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.text3}
              secureTextEntry={!show}
              onSubmitEditing={submit}
              style={[inputStyle, { paddingRight: 60 }]}
            />
            <Pressable
              onPress={() => setShow((s) => !s)}
              style={{ position: "absolute", right: 12 }}
            >
              <Text style={{ color: COLORS.text3, fontSize: 12, fontWeight: "600" }}>
                {show ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          {err !== "" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 14,
                padding: 10,
                borderRadius: 9,
                backgroundColor: COLORS.st.red + "14",
                borderWidth: 1,
                borderColor: COLORS.st.red + "3D",
              }}
            >
              <Icon name="alert" size={16} color={COLORS.st.red} />
              <Text
                style={{
                  color: COLORS.st.red,
                  fontSize: 13.5,
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {err}
              </Text>
            </View>
          )}

          <View style={{ marginTop: 24 }}>
            <Button
              label="Sign in"
              variant="primary"
              full
              onPress={submit}
              style={{ paddingVertical: 12 }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const labelStyle = {
  fontSize: 13,
  fontWeight: "600" as const,
  marginBottom: 7,
  color: COLORS.text2,
};
const inputStyle = {
  width: "100%" as const,
  paddingVertical: 12,
  paddingHorizontal: 14,
  fontSize: 15,
  color: COLORS.text,
  backgroundColor: COLORS.surface,
  borderWidth: 1,
  borderColor: COLORS.line,
  borderRadius: 10,
  ...(Platform.OS === "web" ? webTextStyle({ outlineStyle: "none" }) : {}),
};
