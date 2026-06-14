import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { COLORS } from "@/theme/tokens";
import { Icon } from "./Icon";
import { Button } from "./ui";
import { webViewStyle } from "@/lib/webStyles";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: number;
  flex?: number;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: string;
  minWidth?: number;
  onRowPress?: (row: T) => void;
  rowHighlight?: (row: T) => boolean;
  // server pagination (controlled)
  page?: number;
  totalElements?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  empty = "No records found.",
  minWidth = 960,
  onRowPress,
  rowHighlight,
  page = 0,
  totalElements,
  totalPages = 1,
  pageSize = 20,
  onPageChange,
}: DataTableProps<T>) {
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const justify = (a?: Column<T>["align"]) =>
    a === "right" ? "flex-end" : a === "center" ? "center" : "flex-start";

  return (
    <View>
      <View
        style={webViewStyle({
          borderWidth: 1,
          borderColor: COLORS.line,
          borderRadius: 12,
          backgroundColor: COLORS.surface,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(28,23,21,.05)",
        })}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ minWidth: "100%" }}
        >
          <View style={{ flex: 1, minWidth }}>
            {/* header */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: COLORS.surface2,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.line,
              }}
            >
              {columns.map((c) => (
                <View
                  key={c.key}
                  style={{
                    flex: c.flex ?? (c.width ? undefined : 1),
                    width: c.width,
                    minWidth: 0,
                    paddingVertical: 11,
                    paddingHorizontal: 16,
                    alignItems: justify(c.align),
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: COLORS.text3,
                    }}
                  >
                    {c.label}
                  </Text>
                </View>
              ))}
            </View>
            {/* body */}
            {loading && rows.length === 0 && (
              <View style={{ padding: 48, alignItems: "center" }}>
                <Text style={{ color: COLORS.text3 }}>Loading…</Text>
              </View>
            )}
            {!loading && rows.length === 0 && (
              <View style={{ padding: 48, alignItems: "center" }}>
                <Text style={{ color: COLORS.text3 }}>{empty}</Text>
              </View>
            )}
            {rows.map((row, ri) => {
              const hl = rowHighlight?.(row);
              const isHover = hoverRow === row.id;
              const bg = isHover ? COLORS.surface2 : hl ? COLORS.st.red + "0F" : "transparent";
              return (
                <Pressable
                  key={row.id}
                  onPress={onRowPress ? () => onRowPress(row) : undefined}
                  onHoverIn={() => setHoverRow(row.id)}
                  onHoverOut={() => setHoverRow(null)}
                  style={{
                    flexDirection: "row",
                    minHeight: 70,
                    backgroundColor: bg,
                    borderBottomWidth: ri === rows.length - 1 ? 0 : 1,
                    borderBottomColor: COLORS.lineSoft,
                  }}
                >
                  {columns.map((c) => (
                    <View
                      key={c.key}
                      style={{
                        flex: c.flex ?? (c.width ? undefined : 1),
                        width: c.width,
                        minWidth: 0,
                        overflow: "hidden",
                        paddingVertical: 13,
                        paddingHorizontal: 16,
                        alignItems: justify(c.align),
                        justifyContent: "center",
                      }}
                    >
                      {(() => {
                        const el = c.render(row);
                        return typeof el === "string" || typeof el === "number" ? (
                          <Text style={{ color: COLORS.text, fontSize: 14 }}>{el}</Text>
                        ) : (
                          el
                        );
                      })()}
                    </View>
                  ))}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {onPageChange && totalElements !== undefined && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </View>
  );
}

function Pagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const from = totalElements === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(totalElements, (page + 1) * pageSize);
  const nums: number[] = [];
  for (let i = 0; i < Math.min(totalPages, 7); i++) {
    let p = i;
    if (totalPages > 7) {
      if (page > 3) p = page - 3 + i;
      if (p > totalPages - 1) p = totalPages - 7 + i;
    }
    nums.push(p);
  }
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 14,
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <Text style={{ fontSize: 13, color: COLORS.text2 }}>
        Showing{" "}
        <Text style={{ fontWeight: "700", color: COLORS.text }}>
          {from}–{to}
        </Text>{" "}
        of <Text style={{ fontWeight: "700", color: COLORS.text }}>{totalElements}</Text>
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Button
          icon="chevL"
          size="sm"
          variant="default"
          onPress={() => onPageChange(Math.max(0, page - 1))}
          style={{ opacity: page === 0 ? 0.45 : 1, paddingHorizontal: 9 }}
        />
        {nums.map((p) => (
          <Pressable
            key={p}
            onPress={() => onPageChange(p)}
            style={{
              minWidth: 32,
              height: 32,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: p === page ? COLORS.orange : COLORS.line,
              backgroundColor: p === page ? COLORS.orange : COLORS.surface,
            }}
          >
            <Text
              style={{ fontSize: 13, fontWeight: "600", color: p === page ? "#fff" : COLORS.text2 }}
            >
              {p + 1}
            </Text>
          </Pressable>
        ))}
        <Button
          icon="chevR"
          size="sm"
          variant="default"
          onPress={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          style={{ opacity: page >= totalPages - 1 ? 0.45 : 1, paddingHorizontal: 9 }}
        />
      </View>
    </View>
  );
}
