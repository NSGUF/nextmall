"use client";
import { Box, Stack, Input, Icon, Text } from "@chakra-ui/react";
import { Field } from "@chakra-ui/react";
import { Button } from "@/app/_components/ui";
import { FiMapPin, FiChevronRight } from "react-icons/fi";
import TopNav from "../../_components/TopNav";
import { useState, useEffect } from "react";
import provinces from "china-division/dist/provinces.json";
import cities from "china-division/dist/cities.json";
import areas from "china-division/dist/areas.json";
import { Select } from "@chakra-ui/react";
import { NativeSelect } from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { api } from "@/trpc/react";
import { Switch } from "@chakra-ui/react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AddressAddPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, setValue, watch } = useForm({
        mode: "onBlur",
        defaultValues: {
            name: "",
            phone: "",
            province: "",
            city: "",
            district: "",
            detail: "",
            isDefault: false
        }
    });
    const createAddress = api.address.create.useMutation();
    const updateAddress = api.address.update.useMutation();
    const { data: addressDetail, isLoading: isDetailLoading } = api.address.get.useQuery(
        id ? { id } : undefined,
        { enabled: !!id }
    );

    // 注册city和district的required校验
    useEffect(() => {
        register("city", { required: "请选择市" });
        register("district", { required: "请选择区" });
    }, [register]);

    // 回显数据
    useEffect(() => {
        if (addressDetail) {
            const [provinceCode] = addressDetail.province.split("/");
            const [cityCode] = addressDetail.city.split("/");
            const [districtCode] = addressDetail.district.split("/");
            reset({
                ...addressDetail,
                province: provinceCode,
                city: cityCode,
                district: districtCode,
                isDefault: addressDetail.isDefault ?? false,
            });
        }
    }, [addressDetail, reset]);

    async function onSubmit(data: any) {
        try {
            const provinceObj = provinces.find(p => p.code === data.province);
            const cityObj = cities.find(c => c.code === data.city);
            const districtObj = areas.find(a => a.code === data.district);
            const payload = {
                ...data,
                province: provinceObj ? provinceObj.code + '/' + provinceObj.name : '',
                city: cityObj ? cityObj.code + '/' + cityObj.name : '',
                district: districtObj ? districtObj.code + '/' + districtObj.name : '',
            };
            if (id) {
                await updateAddress.mutateAsync({ id, ...payload });
            } else {
                await createAddress.mutateAsync(payload);
            }
            reset();
            router.push("/full/address");
        } catch (e: any) {
            // 错误由createAddress.error处理
        }
    }

    // 监听省市区变化
    const province = watch("province");
    const city = watch("city");

    return (
        <Box>
            <TopNav />
            <Box p={4}>
                {isDetailLoading && id ? <Text>加载中...</Text> : null}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack gap={4} maxW="sm" css={{ "--field-label-width": "80px" }}>
                        {/* 收货人 */}
                        <Field.Root orientation="horizontal" invalid={!!errors.name}>
                            <Field.Label>收货人</Field.Label>
                            <Box flex="1">
                                <Input
                                    placeholder="请输入收货人"
                                    border="none"
                                    _focus={{ border: "none" }}
                                    {...register("name", { required: "收货人不能为空" })}
                                />
                                {typeof errors.name?.message === 'string' && <Field.ErrorText>{errors.name.message}</Field.ErrorText>}
                            </Box>
                        </Field.Root>
                        {/* 手机号 */}
                        <Field.Root orientation="horizontal" invalid={!!errors.phone}>
                            <Field.Label>手机号</Field.Label>
                            <Box flex="1">
                                <Input
                                    placeholder="请输入手机号"
                                    border="none"
                                    _focus={{ border: "none" }}
                                    {...register("phone", {
                                        required: "手机号不能为空",
                                        pattern: {
                                            value: /^1[3-9]\d{9}$/,
                                            message: "手机号格式不正确"
                                        }
                                    })}
                                />
                                {typeof errors.phone?.message === 'string' && <Field.ErrorText>{errors.phone.message}</Field.ErrorText>}
                            </Box>
                        </Field.Root>
                        {/* 所在地区 */}
                        <Controller
                            name="province"
                            control={control}
                            rules={{ required: "请选择省份" }}
                            render={({ field }) => (
                                <Field.Root orientation="horizontal" invalid={!!errors.province || !!errors.city || !!errors.district}>
                                    <Field.Label>所在地区</Field.Label>
                                    <Box flex="1">
                                        <RegionSelector
                                            provinceValue={field.value}
                                            cityValue={watch("city")}
                                            districtValue={watch("district")}
                                            onChange={(p, c, d) => {
                                                setValue("province", p);
                                                setValue("city", c);
                                                setValue("district", d);
                                            }}
                                        />
                                        {typeof errors.province?.message === 'string' && <Field.ErrorText>{errors.province.message}</Field.ErrorText>}
                                        {typeof errors.city?.message === 'string' && <Field.ErrorText>{errors.city.message}</Field.ErrorText>}
                                        {typeof errors.district?.message === 'string' && <Field.ErrorText>{errors.district.message}</Field.ErrorText>}
                                    </Box>
                                </Field.Root>
                            )}
                        />
                        {/* 详细地址 */}
                        <Field.Root orientation="horizontal" invalid={!!errors.detail}>
                            <Field.Label>详细地址</Field.Label>
                            <Box flex="1">
                                <Input
                                    placeholder="请输入详细地址"
                                    border="none"
                                    _focus={{ border: "none" }}
                                    {...register("detail", { required: "详细地址不能为空" })}
                                />
                                {typeof errors.detail?.message === 'string' && <Field.ErrorText>{errors.detail.message}</Field.ErrorText>}
                            </Box>
                        </Field.Root>
                        <Field.Root orientation="horizontal">
                            <Controller
                                name="isDefault"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        <Switch.Root
                                            name={field.name}
                                            checked={field.value}
                                            onCheckedChange={({ checked }) => field.onChange(checked)}
                                        >
                                            <Switch.HiddenInput onBlur={field.onBlur} />
                                            <Switch.Control>
                                                <Switch.Thumb />
                                            </Switch.Control>
                                            <Switch.Label >是否默认地址</Switch.Label>
                                        </Switch.Root>
                                        {/* 可选：错误提示 */}
                                        {/* <Field.ErrorText>{errors.isActive?.message}</Field.ErrorText> */}
                                    </>
                                )}
                            />
                        </Field.Root>
                    </Stack>
                    <Box
                        position="fixed"
                        left={0}
                        right={0}
                        bottom={0}
                        bg="transparent"
                        zIndex={10}
                        p={4}
                    >
                        <Button
                            w="100%"
                            borderRadius="md"
                            bg="#fa2222"
                            color="#fff"
                            size="xl"
                            type="submit"
                            loading={isSubmitting}
                        >
                            保存
                        </Button>
                        {createAddress.error && (
                            <Text color="red.500" fontSize="sm" mt={2}>{createAddress.error.message || "保存失败"}</Text>
                        )}
                    </Box>
                </form>
            </Box>
        </Box>
    );
}

// 省市区三级联动组件，支持受控
function RegionSelector({ provinceValue, cityValue, districtValue, onChange }: {
    provinceValue: string;
    cityValue: string;
    districtValue: string;
    onChange: (province: string, city: string, district: string) => void;
}) {
    const [province, setProvince] = useState(provinceValue || "");
    const [city, setCity] = useState(cityValue || "");
    const [district, setDistrict] = useState(districtValue || "");

    // 省份变化时，市区都清空
    useEffect(() => {
        setProvince(provinceValue || "");
        setCity("");
        setDistrict("");
    }, [provinceValue]);
    // 市变化时，区清空
    useEffect(() => {
        setCity(cityValue || "");
        setDistrict("");
    }, [cityValue]);
    // 区变化
    useEffect(() => {
        setDistrict(districtValue || "");
    }, [districtValue]);

    const filteredCities = cities.filter((c) => c.provinceCode === province);
    const filteredAreas = areas.filter((a) => a.cityCode === city);

    // 如果没有市/区，value 也要清空
    const cityValueSafe = filteredCities.find(c => c.code === city) ? city : "";
    const districtValueSafe = filteredAreas.find(a => a.code === district) ? district : "";

    return (
        <Box display="flex" gap={2} flex="1">
            <NativeSelect.Root>
                <NativeSelect.Field value={province} onChange={e => {
                    setProvince(e.currentTarget.value);
                    setCity("");
                    setDistrict("");
                    onChange(e.currentTarget.value, "", "");
                }}>
                    <option value="">省</option>
                    {provinces.map((p) => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
            </NativeSelect.Root>
            <NativeSelect.Root>
                <NativeSelect.Field value={cityValueSafe} onChange={e => {
                    setCity(e.currentTarget.value);
                    setDistrict("");
                    onChange(province, e.currentTarget.value, "");
                }} _disabled={!province ? {} : undefined}>
                    <option value="">市</option>
                    {filteredCities.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
            </NativeSelect.Root>
            <NativeSelect.Root>
                <NativeSelect.Field value={districtValueSafe} onChange={e => {
                    setDistrict(e.currentTarget.value);
                    onChange(province, city, e.currentTarget.value);
                }} _disabled={!city ? {} : undefined}>
                    <option value="">区</option>
                    {filteredAreas.map((a) => (
                        <option key={a.code} value={a.code}>{a.name}</option>
                    ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
            </NativeSelect.Root>
        </Box>
    );
}