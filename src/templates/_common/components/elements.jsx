import React from 'react'; // eslint-disable-line

export const Li = ({
    className,
    id,
    href,
    param = '',
    target,
    text,
    header,
    p,
}) => {
    const content = p ? <p> {text} </p> : text;

    return (
        <li id={id} className={className}>
            {header && (
                text ? <strong> {header} </strong> : <h3> {header} </h3>
            )}
            {href ?
                <a {...{
                    href  : `${href}${param}`,
                    rel   : /^http/.test(href) ? 'noopener noreferrer' : undefined,
                    target: target || undefined,
                }}>
                    {content}
                </a>
                : content
            }
        </li>
    );
};

export const List = ({
    items,
    id,
    className,
}) => (
    <ul id={id} className={className}>
        {items.map(item => <Li {...item} />)}
    </ul>
);

export const FillBox = ({
    padding,
    center,
    className = '',
    align_left,
    color,
    border,
    image,
    href,
    target,
    download,
    em,
    text,
    children,
}) => {
    let classes1 = '';
    classes1 += padding ? 'gr-12-m gr-6-p gr-padding-10 ' : '';
    classes1 += (padding && center) ? `gr-${padding || 9} gr-centered` : '';
    classes1 += (padding && !center) ? `gr-${padding || 6}` : '';

    let classes2 = '';
    classes2 += align_left ? '' : 'center-text ';
    classes2 += 'gr-gutter gr-padding-20 ';
    classes2 += color === 'dark' ? 'primary-bg-color ' : 'fill-bg-color ';
    classes2 += `${border || ''}`;

    return (
        <div className={[classes1, className].join(' ')}>
            <div className={classes2}>
                <div className="inline-flex center-align gr-gutter">
                    {image &&
                        <img className="half-sized-picture gr-gutter-right" src={it.url_for(image)} />
                    }
                    {href ?
                        <a
                            href={href}
                            target={target || undefined}
                            download={!!download}
                            className={color === 'dark' && 'content-inverse-color'}
                            rel={/^http/.test(href) ? 'noopener noreferrer' : undefined}
                        >
                            {em ? <em> {text} </em> : text}
                        </a>
                        :
                        <p className="gr-gutter">
                            {em ? <em> {text} </em> : text}
                        </p>
                    }
                </div>
            </div>
            {children}
        </div>
    );
};

export const Select = ({
    id,
    className,
    options,
}) => (
    <select id={id} className={className} >
        {options.map(option => (
            <option value={option.value || undefined} selected={!!option.selected} >
                {option.text}
            </option>
        ))}
    </select>
);

export const Tbody = ({
    trs,
    tbody_id,
}) => (
    <tbody id={tbody_id}>
        {trs.map(tr => (
            <tr>
                {tr.map(td => (
                    td.header ?
                        <th className={td.className} {...td.balloon ? { 'data-balloon': td.balloon } : {}}>
                            {td.header}
                        </th>
                        :
                        <td className={td.className} id={td.id}>
                            {td.text}
                        </td>
                ))}
            </tr>
        ))}
    </tbody>
);

export const Table = ({
    id,
    className,
    data,
    scroll,
    tbody_id,
}) => {
    const content = (
        <table id={id} className={className}>
            { data.thead &&
                <thead>
                    {data.thead.map(row => (
                        <tr>
                            {row.map(th => (
                                <th className={th.className} >{th.text}</th>
                            ))}
                        </tr>
                    ))}
                </thead>
            }
            <Tbody
                trs={data.tbody}
                tbody_id={tbody_id}
            />
            { data.tfoot &&
                <tfoot>
                    {data.tfoot.map(row => (
                        <tr>
                            {row.map(th => (
                            <th
                                className={th.className}
                                id={th.id}
                                {... (th.attributes || {}) }
                            >
                                    {th.text}
                                </th>
                            ))}
                        </tr>
                    ))}
                </tfoot>
            }
        </table>
    );
    return (
        scroll ?
            <div className="table-container">
                {content}
            </div>
            :
            content
    );
};